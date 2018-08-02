using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Newtonsoft.Json;
using untrustedServer.Models;
using System.Security.Claims;
using untrustedServer.Services;

namespace untrustedServer
{
    public class TokenService
    {
        UserServices us = new UserServices();

        public bool validateToken(HttpRequest request,out SecurityToken securityToken)
        {
            string token;
            securityToken = null;
            //determine whether a jwt exists or not
            if (!TryRetrieveToken(request, out token))
            {
                //allow requests with no token - whether a action method needs an authentication can be set with the claimsauthorization attribute
                return false;
            }

            try
            {
                const string sec = "401b09eab3c013d4ca54922bb802bec8fd5318192b0a75f201d8b3727429090fb337591abd3e44453b954555b7a0812e1081c39b740293f765eae731f5a65ed1";
                var now = DateTime.UtcNow;
                var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.Default.GetBytes(sec));

                JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
                TokenValidationParameters validationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    LifetimeValidator = this.LifetimeValidator,
                    IssuerSigningKey = securityKey
                };
                //extract and assign the user of the jwt
                handler.ValidateToken(token, validationParameters, out securityToken);

                return true;
            }
            catch (SecurityTokenValidationException e)
            {

                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        

        public bool LifetimeValidator(DateTime? notBefore, DateTime? expires, SecurityToken securityToken, TokenValidationParameters validationParameters)
        {
            if (expires != null)
            {
                if (DateTime.UtcNow < expires) return true;
            }
            return false;
        }

        private bool TryRetrieveToken(HttpRequest request, out string token)
        {
            token = null;
            StringValues authzHeaders;
            if (!request.Headers.TryGetValue("Authorization", out authzHeaders))
            {
                return false;
            }
            token = authzHeaders.ElementAt(0);
            return true;
        }

        public string createToken(User user)
        {
            //Set issued at date
            DateTime issuedAt = DateTime.UtcNow;
            //set the time when it expires
            DateTime expires = DateTime.UtcNow.AddDays(1);

            //http://stackoverflow.com/questions/18223868/how-to-encrypt-jwt-security-token
            var tokenHandler = new JwtSecurityTokenHandler();

            //create a identity and add claims to the user which we want to log in
            ClaimsIdentity claimsIdentity = new ClaimsIdentity(new[]
            {
                new Claim("username", user.username),
                new Claim("password", user.password)
            });

            const string sec = "401b09eab3c013d4ca54922bb802bec8fd5318192b0a75f201d8b3727429090fb337591abd3e44453b954555b7a0812e1081c39b740293f765eae731f5a65ed1";
            var now = DateTime.UtcNow;
            var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.Default.GetBytes(sec));
            var signingCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(securityKey, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature);


            //create the jwt
            var token =
                (JwtSecurityToken)
                    tokenHandler.CreateJwtSecurityToken(subject: claimsIdentity, notBefore: issuedAt, expires: expires, signingCredentials: signingCredentials);
            var tokenString = tokenHandler.WriteToken(token);

            return tokenString;
        }

        public User getUserFromToken(SecurityToken securityToken)
        {
            JwtSecurityToken jwtSecurityToken = securityToken as JwtSecurityToken;
            string username = jwtSecurityToken.Claims.First(claims => claims.Type.Equals("username")).Value;
            string password = jwtSecurityToken.Claims.First(claims => claims.Type.Equals("password")).Value;
            User user = us.login(username, password);
            return user;
        }
    }
}
