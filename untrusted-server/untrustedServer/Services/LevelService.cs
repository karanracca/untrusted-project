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

        IMongoCollection<Level> levelCollection;
        MongoService ms =  new MongoService();

        public LevelService()
        {

            levelCollection = ms.GetLevel;

        }

        public IActionResult CreateLevel()
        {
            string line;
            System.IO.StreamReader file = new System.IO.StreamReader(@"TextFile.txt");
            int count = 1;
            while ((line = file.ReadLine())!=null)
            {
                string[] split = line.Split('^');
                levelCollection.InsertOne(new Level(count, split[0], split[1]));
                count++;
            }
            return new OkObjectResult("Levels Created");

        }

        public Level getlevel(int levelNo)
        {
            var filter = Builders<Level>.Filter.Eq("number", levelNo);
            return levelCollection.Find(filter).First();
        }
    }
}
