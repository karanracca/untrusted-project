using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace untrustedServer.Models
{
    public class Stats
    {
        public string fullname { get; set; }

        public int score { get; set; }

        public int level { get; set; }

        public Stats(string fullname, int score, int level)
        {
            this.fullname = fullname;
            this.score = score;
            this.level = level;
        }
    }
}
