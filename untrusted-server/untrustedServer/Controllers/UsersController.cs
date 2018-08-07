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
                return base.Ok(us.GetUsers().Select(user=> new { user.fullname,user.score,user.level.levelNo,user.level.levelName,user.level.layout}));
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
                return base.Ok(users.Select(user => new Stats(user.fullname,user.score, user.level.levelNo)).OrderByDescending(stats => stats.score));
            }
            else
            {
                return base.Unauthorized();
            }
        }

        [HttpGet]
        [Route("api/[controller]/[action]")]
        [ActionName("ResetLevel")]
        public IActionResult ResetLevel()
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                User loggedInUser = ts.getUserFromToken(securityToken);
                loggedInUser = us.resetStats(loggedInUser);
                if (loggedInUser == null)
                {
                    return NotFound();
                }
                string token = ts.createToken(loggedInUser);
                var level = new { loggedInUser.level.levelNo, loggedInUser.level.levelName, loggedInUser.level.layout };
                var user = new { loggedInUser.fullname, loggedInUser.score, level };
                var response = new { token, user };
                return base.Ok(response);
            }
            else
            {
                return Unauthorized();
            }
        }

        [HttpGet]
        [Route("api/[controller]/[action]")]
        [ActionName("levelByNo")]
        public IActionResult getlevelByNo([FromQuery]int levelNo)
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                User loggedInUser = ts.getUserFromToken(securityToken);
                loggedInUser = us.updateLevel(loggedInUser,levelNo);
                if (loggedInUser == null)
                {
                    return NotFound();
                }
                string token = ts.createToken(loggedInUser);
                var level = new { loggedInUser.level.levelNo, loggedInUser.level.levelName, loggedInUser.level.layout };
                var user = new { loggedInUser.fullname, loggedInUser.score, level };
                var response = new { token, user };
                return base.Ok(response);
            }
            else
            {
                return Unauthorized();
            }
        }


    }
}
