using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using untrustedServer.Models;
using untrustedServer.Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace untrustedServer.Controllers
{
    [EnableCors("AllowAnyOrigin")]
    public class UsersController : Controller
    {
        UserServices us = new UserServices();
        TokenService ts = new TokenService();
        LevelService ls = new LevelService();

        [HttpGet]
        [Route("api/[controller]")]
        public IActionResult GetUsers()
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                return base.Ok(us.GetUsers());
            }
            else
            {
                return base.Unauthorized();
            }
        }

        [HttpPost]
        [Route("api/[controller]/[action]")]
        [ActionName("CreateUser")]
        public IActionResult CreateUser([FromBody] User user)
        {
            if (user == null)
            {
                return base.BadRequest("Enter all details");
            }
            return us.CreateUser(user);
        }
        
        [HttpGet]
        [Route("api/[controller]/[action]")]
        [ActionName("Leaderboard")]
        public IActionResult GetLeaderBoard()
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                List<User> users = us.GetUsers();
                if (users.Count() == 0)
                {
                    return base.NotFound();
                }
                return base.Ok(users.Select(user => new Stats(user.fullname,user.score, user.level)).OrderByDescending(stats => stats.score));
            }
            else
            {
                return base.Unauthorized();
            }
        }

        [HttpPost]
        [Route("api/[controller]/[action]")]
        [ActionName("UpdateStats")]
        public IActionResult UpdateStats()
        {
            if (ts.validateToken(this.Request,out SecurityToken securityToken))
            {
                User user = getUserFromToken(securityToken);
                user = us.UpdateStats(user);
                if (user == null)
                {
                    return NotFound();
                }
                string token = ts.createToken(user);
                Level level = ls.getlevel(user.level);
                return base.Ok(new {token, level });
            }
            else
            {
                return Unauthorized();
            }
        }


        private User getUserFromToken(SecurityToken securityToken)
        {
            JwtSecurityToken jwtSecurityToken = securityToken as JwtSecurityToken;
            string value = jwtSecurityToken.Claims.First(claims => claims.Type.Equals("User")).Value;
            User user = JsonConvert.DeserializeObject<User>(value);
            return user;
        }
    }
}
