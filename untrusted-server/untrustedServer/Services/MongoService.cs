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
                _client = new MongoClient("mongodb://admin:password12@ds113402.mlab.com:13402/backup");
                _db = _client.GetDatabase("backup");
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
