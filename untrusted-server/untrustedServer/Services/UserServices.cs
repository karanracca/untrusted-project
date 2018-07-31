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
        MongoClient _client;
        IMongoDatabase _db;
        IMongoCollection<User> mongoCollection;

        public UserServices()
        {
            _client = new MongoClient("mongodb://admin:password12@ds255451.mlab.com:55451/mongo");
            _db = _client.GetDatabase("mongo");
            mongoCollection = _db.GetCollection<User>("Users");
        }

        public List<User> GetUsers()
        {
            return mongoCollection.Find(new BsonDocument()).ToList();
        }

        public User GetUser(ObjectId id)
        {
            var filter = Builders<User>.Filter.Eq("_id", id);
            return mongoCollection.Find(filter).First();
        }

        public IActionResult CreateUser(User user)
        {
            List<User> users = GetUsers();

            if (users.Exists(u => u.username == user.username))
            {
                return new NotFoundObjectResult("Username already exist");
            }
            else if (users.Exists(u => u.email == user.email))
            {
                return new NotFoundObjectResult("Email already exist");
            }
            else
            {
                mongoCollection.InsertOne(new User(user.username, user.password, user.firstName, user.lastName, user.email, user.phone));
                return new OkObjectResult("User Created");
            }

        }

        public User login(string username, string password)
        {
            return GetUsers().Find(u => u.username == username && u.password == password);
        }

        public User UpdateStats(User user)
        {
            var filter = Builders<User>.Filter.Eq("username", user.username);
            int updatedLevel = user.level + 1;
            int updatedScore = user.score + (10 * updatedLevel);
            var update = Builders<User>.Update.Set("level", updatedLevel).Set("score", updatedScore);
            UpdateResult updateResult = mongoCollection.UpdateOne(filter, update);
            if (updateResult.IsAcknowledged)
            {
                return mongoCollection.Find(filter).First();
            }
            return null;
        }
    }
}