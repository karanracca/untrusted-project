using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using untrustedServer.Models;

namespace untrustedServer.Services
{
    public class MongoService
    {
        MongoClient _client;
        IMongoDatabase _db;
        IMongoCollection<User> userCollection;
        IMongoCollection<Level> levelCollection;

        public MongoService()
        {
            try
            {
                _client = new MongoClient("mongodb://admin:password12@ds113122.mlab.com:13122/mongo");
                _db = _client.GetDatabase("mongo");
                userCollection = _db.GetCollection<User>("Users");
                levelCollection = _db.GetCollection<Level>("Levels");
            }
            catch (Exception e)
            {
                Console.WriteLine("Unable to connect to Mongo");
            }
        }

        public IMongoCollection<User> GetUser { get { return userCollection; } }
        public IMongoCollection<Level> GetLevel { get { return levelCollection; } }

    }
}
