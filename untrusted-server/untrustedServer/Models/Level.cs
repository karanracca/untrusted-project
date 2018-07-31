using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace untrustedServer.Models
{
    public class Level
    {
        public ObjectId _id { get; set; }

        [BsonElement("number")]
        public int levelNo { get; set; }

        [BsonElement("name")]
        public string levelName { get; set; }

        [BsonElement("layout")]
        public string layout{ get; set; }

        public Level(int levelNo, string levelName, string layout)
        {
            this.levelNo = levelNo;
            this.levelName = levelName;
            this.layout = layout;
        }
    }
}
