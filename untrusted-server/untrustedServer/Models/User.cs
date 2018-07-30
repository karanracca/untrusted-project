using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace untrustedServer.Models
{
    public class User
    {

        public ObjectId _id { get; set; }

        [BsonElement("username")]
        public string username { get; set; }

        [BsonElement("password")]
        public string password { get; set; }

        [BsonElement("firstName")]
        public string firstName { get; set; }

        [BsonElement("lastName")]
        public string lastName { get; set; }

        [BsonElement("email")]
        public string email { get; set; }

        [BsonElement("phone")]
        public string phone { get; set; }

        [BsonElement("score")]
        public int score { get; set; } = 0;

        [BsonElement("level")]
        public int level { get; set; } = 1;

        public User(string username, string password, string firstName, string lastName, string email, string phone)
        {
            this.username = username;
            this.password = password;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
        }

        public User()
        {
        }

    }
}
