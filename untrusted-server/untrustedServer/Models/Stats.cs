using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace untrustedServer.Models
{
    public class Stats
    {
        public string firstName { get; set; }

        public string lastName { get; set; }

        public int score { get; set; }

        public int level { get; set; }

        public Stats(string firstName, string lastName, int score, int level)
        {
            this.firstName = firstName;
            this.lastName = lastName;
            this.score = score;
            this.level = level;
        }
    }
}
