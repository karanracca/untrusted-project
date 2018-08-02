using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using untrustedServer.Models;
using untrustedServer.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.IdentityModel.Tokens;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace untrustedServer.Controllers
{
    [EnableCors("AllowAnyOrigin")]
    public class LevelController : Controller
    {

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
        [Route("api/[controller]/{number}")]
        public IActionResult GetLevel(int number)
        {
            if (ts.validateToken(this.Request, out SecurityToken securityToken))
            {
                Level level = ls.getlevel(number);
                if (level == null)
                {
                    return base.NotFound();
                }
                return base.Ok(level);
            }
            else
            {
                return base.Unauthorized();
            }
        }

    }
}
