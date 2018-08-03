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
            User loggedInUser = us.login(login.username, login.password);
            if (loggedInUser == null)
            {
                return base.NotFound();
            }
            string token = ts.createToken(loggedInUser);
            var level = new { loggedInUser.level.levelNo, loggedInUser.level.levelName, loggedInUser.level.layout };
            var user = new { loggedInUser.fullname, loggedInUser.score ,level};
            var response = new { token, user };
            return base.Ok(response);
        }
        
    }
}
