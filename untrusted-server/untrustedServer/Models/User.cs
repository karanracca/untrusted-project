using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using untrustedServer.Services;

namespace untrustedServer.Models
{
    public class User
    {
        LevelService ls = new LevelService();

        public ObjectId _id { get; set; }

        [BsonElement("username")]
        public string username { get; set; }

        [BsonElement("password")]
        public string password { get; set; }

        [BsonElement("fullname")]
        public string fullname { get; set; }

        [BsonElement("score")]
        public int score { get; set; } = 0;

        [BsonElement("level")]
        public Level level { get; set; }

        public User(string username, string password, string fullname)
        {
            this.username = username;
            this.password = password;
            this.fullname = fullname;
            level = ls.getlevel(1);
        }

        public User()
        {
        }

    }
}
