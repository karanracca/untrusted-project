using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using untrustedServer.Models;
using untrustedServer.Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace untrustedServer.Controllers
{
    [EnableCors("AllowAnyOrigin")]
    public class UsersController : Controller
    {
        UserServices us = new UserServices();

        [HttpGet]
        [Route("api/[controller]")]
        public IEnumerable<User> GetUsers()
        {
            return us.GetUsers();
        }

        [HttpPost]
        [Route("api/[controller]/[action]")]
        [ActionName("CreateUser")]
        public IActionResult CreateUser([FromBody] User user)
        {
            if (user == null)
            {
                return new BadRequestResult();
            }
            return us.CreateUser(user);
        }

        [HttpPost]
        [Route("api/[controller]/[action]")]
        [ActionName("Login")]
        public IActionResult Login([FromQuery] string username, [FromQuery] string password)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                return new BadRequestResult();
            }

            User user = us.login(username, password);
            if(user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }
    }
}
