using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using untrustedServer.Models;
using untrustedServer.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Newtonsoft.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace untrustedServer.Controllers
{
    [EnableCors("AllowAnyOrigin")]
    public class LevelController : Controller
    {
        UserServices us = new UserServices();
        LevelService ls = new LevelService();
        TokenService ts = new TokenService();
        
        // For configuration use only. not to be used from client side
        [HttpPost]
        [Route("api/[controller]/[action]")]
        [ActionName("CreateLevel")]
        public IActionResult CreateLevel()
        {
            return ls.CreateLevel();
        }

        [HttpGet]
        [Route("api/[controller]")]
        public IActionResult GetLevel()
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                User user = ts.getUserFromToken(securityToken);
                Level level = ls.getlevel(user.level.levelNo);
                if (level == null)
                {
                    return base.NotFound();
                }
                return base.Ok(new { level.levelNo, level.levelName, level.layout });
            }
            else
            {
                return base.Unauthorized();
            }
        }

        [HttpGet]
        [Route("api/[controller]/[action]")]
        [ActionName("UpdateLevel")]
        public IActionResult UpdateLevel()
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                User user = ts.getUserFromToken(securityToken);
                user = us.UpdateStats(user);
                if (user == null)
                {
                    return NotFound();
                }
                string token = ts.createToken(user);
                user.level = ls.getlevel(user.level.levelNo);
                return base.Ok(new { token, user.fullname, user.score, user.level.levelNo,user.level.levelName,user.level.layout });
            }
            else
            {
                return Unauthorized();
            }
        }

    }
}
