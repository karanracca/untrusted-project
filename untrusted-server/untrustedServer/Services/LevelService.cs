using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using untrustedServer.Models;

namespace untrustedServer.Services
{
    public class LevelService
    {
        MongoClient _client;
        IMongoDatabase _db;
        IMongoCollection<Level> mongoCollection;

        public LevelService()
        {
            _client = new MongoClient("mongodb://admin:password12@ds255451.mlab.com:55451/mongo");
            _db = _client.GetDatabase("mongo");
            mongoCollection = _db.GetCollection<Level>("Levels");

        }

        public IActionResult CreateLevel()
        {
            string line;
            System.IO.StreamReader file = new System.IO.StreamReader(@"TextFIle.txt");
            int count = 1;
            while ((line = file.ReadLine())!=null)
            {
                string[] split = line.Split('^');
                mongoCollection.InsertOne(new Level(count, split[0], split[1]));
                count++;
            }
            return new OkObjectResult("Levels Created");

        }

        public Level getlevel(int levelNo)
        {
            var filter = Builders<Level>.Filter.Eq("number", levelNo);
            return mongoCollection.Find(filter).First();
        }
    }
}
