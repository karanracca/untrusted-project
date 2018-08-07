using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using untrustedServer.Models;

namespace untrustedServer.Services
{
    public class UserServices
    {
        MongoService ms = new MongoService();
        IMongoCollection<User> userCollection;

        LevelService ls = new LevelService();

        public UserServices()
        {
            userCollection = ms.GetUser;
        }

        public List<User> GetUsers()
        {
            IFindFluent<User, User> findFluent = userCollection.Find(new BsonDocument());
            if(findFluent.CountDocuments() == 0)
            {
                return new List<User>();
            }
            return findFluent.ToList();
        }

        public User GetUser(ObjectId id)
        {
            var filter = Builders<User>.Filter.Eq("_id", id);
            return userCollection.Find(filter).First();
        }

        public IActionResult CreateUser(User user)
        {
            List<User> users = GetUsers();

            if (users.Exists(u => u.username == user.username))
            {
                return new BadRequestObjectResult("Username already exist");
            }
            else
            {
                userCollection.InsertOne(new User(user.username, user.password, user.fullname));
                return new OkObjectResult("User Created");
            }

        }

        public User login(string username, string password)
        {
            var filter = Builders<User>.Filter.And(Builders<User>.Filter.Eq("username", username), Builders<User>.Filter.Eq("password", password));

            IFindFluent<User, User> findFluent = userCollection.Find(filter);
            if (findFluent.CountDocuments() != 0)
            {
                return findFluent.First();
            }
            return null;
        }

        public User UpdateStats(User user)
        {
            var filter = Builders<User>.Filter.Eq("username", user.username);
            int updatedScore = user.score + (10 * user.level.levelNo);
            int newLevelNo = user.level.levelNo + 1;
            Level updatedLevel = ls.getlevel(newLevelNo);   
            var update = Builders<User>.Update.Set("level", updatedLevel).Set("score", updatedScore);
            UpdateResult updateResult = userCollection.UpdateOne(filter, update);
            if (updateResult.IsAcknowledged)
            {
                return userCollection.Find(filter).First();
            }
            return null;
        }

        public User resetStats(User user)
        {
            var filter = Builders<User>.Filter.Eq("username", user.username);
            Level updatedLevel = ls.getlevel(1);
            int updatedScore = 0;
            var update = Builders<User>.Update.Set("level", updatedLevel).Set("score", updatedScore);
            UpdateResult updateResult = userCollection.UpdateOne(filter, update);
            if (updateResult.IsAcknowledged)
            {
                return userCollection.Find(filter).First();
            }
            return null;
        }

        public User updateLevel(User user,int levelNo)
        {
            var filter = Builders<User>.Filter.Eq("username", user.username);
            Level updatedLevel = ls.getlevel(levelNo);
            var update = Builders<User>.Update.Set("level", updatedLevel);
            UpdateResult updateResult = userCollection.UpdateOne(filter, update);
            if (updateResult.IsAcknowledged)
            {
                return userCollection.Find(filter).First();
            }
            return null;
        }
    }
}