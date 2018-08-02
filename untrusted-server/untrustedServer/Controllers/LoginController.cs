using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using untrustedServer.Models;
using untrustedServer.Services;

namespace untrustedServer.Controllers
{
    [EnableCors("AllowAnyOrigin")]
    [Route("api/[controller]")]
    public class LoginController : Controller
    {

        UserServices us = new UserServices();
        TokenService ts = new TokenService();

        [HttpPost]
        public IActionResult Login([FromBody] Login login)
        {
            User user = us.login(login.username, login.password);
            if (user == null)
            {
                return base.NotFound();
            }
            string token = ts.createToken(user);
            return base.Ok(new { token, user.fullname,user.score,user.level.levelNo,user.level.levelName,user.level.layout });
        }
        
    }
}
