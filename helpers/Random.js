

////////////////////////////////////////////////////////////////////////////////
// RANDOM NUMBER GENERATION
////////////////////////////////////////////////////////////////////////////////

/**
 * Use:
 * 
 * let rand = randomGen("Apple")
 * 
 * rand()
 * rand()
 * ...
 * 
 * @param {str} str A string that when hashed will work as a a good seed generator 
 * @returns a pseudy random number generator 
 */
function randomGen(str) {
    // Create xmur3 state:
    var seed = xmur3(str);
    // Output four 32-bit hashes to provide the seed for sfc32.
    return sfc32(seed(), seed(), seed(), seed());
}


/**
 * 
 * @param {str} str A string that when hashed will work as a a good seed generator 
 * @returns a function that can be used to produce seeds
 */
function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return function () {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

/**
 * 
 * @param {number} a a 32 bit seed
 * @param {number} b a 32 bit seed
 * @param {number} c a 32 bit seed
 * @param {number} d a 32 bit seed
 * @returns 
 */
function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

////////////////////////////////////////////////////////////////////////////////
// RNG Object
////////////////////////////////////////////////////////////////////////////////


class RNG {
    /**
     * Construct a pseudorandom number generator from a seed
     * 
     * @param {str} seed
     */
    constructor(seed) {
        this.rng = randomGen(seed)
    }

    /**
     * 
     * @returns a random number between 0-1
     */
    random() {
        return this.rng()
    }


    /**
     * Generate a number using a uniform distribution
     * 
     * @param {number} a lower bound
     * @param {number} b upper bound
     * @returns a number between a and b
     */
    uniform(a, b) {
        return a + (b - a) * this.rng()
    }

    /**
     * Generate an integer using a uniform distribution
     * 
     * @param {number} a lower bound (inclusive)
     * @param {number} b upper bound (non-inclusive)
     * @returns an integer between a and b
     */
    uniformInteger(a, b) {
        return floor(this.uniform(a, b))
    }

    pickUniform(list) {
        let rngIndex = this.uniformInteger(0, list.length)
        return list[rngIndex]
    }

    /**
     * 
     * [ { weight :  3, "A",}, { weight : 1, "B"}]
     * 
     * @param {LIST} list a list of weighted values 
     */
    pickFromWeightedList(list) {
        let total = 0
        list.forEach(possibility => { total += possibility.weight })
        let chosen = this.uniformInteger(0, total)
        let accrued = 0
        let index = 0
        let result = 0
        list.forEach(possibility => {

            if (accrued <= chosen && chosen < accrued + possibility.weight) {
                result = index
            }

            accrued += possibility.weight
            index += 1
        })

        return list[result].value
    }

    /**
     * Standard Normal variate using Box-Muller transform.
     * 
     * @returns 
     */
    gaussian_standard() {
        var u = 0, v = 0;
        while (u === 0) u = this.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = this.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * General Normal variate using Box-Muller transform.
     * 
     * @param {number} m mean value 
     * @param {number} e standard deviation 
     * @returns 
     */
    gaussian_general(m, e) {
        return this.gaussian_standard() * e + m
    }

    /**
     * 
     * @param {number} m mean value
     * @param {number} e standard deviation 
     * @param {number} low_bound lower bound 
     * @param {number} upper_bound upper bound
     * @returns 
     */
    truncated_gaussian(m, e, low_bound, upper_bound) {
        let value = this.gaussian_general(m, e)

        if (value >= low_bound && value <= upper_bound) {
            return value
        } else {
            return this.truncated_gaussian(m, e, low_bound, upper_bound)
        }

    }

    /**
     * 
     * @param {number} p the probability that the event is true 
     * @returns a boolean
     */
    bernoulli(p) {
        if (this.rng() < p) {
            return true
        } else {
            return false
        }
    }

    /**
     * 
     * @returns true with 50% and false with 50%
     */
    fairCoin() {
        return this.bernoulli(0.5)
    }

    /**
     * Generate a number between 0-1 using a beta distribution
     * 
     * @param {number} a 
     * @param {number} b 
     * @returns a number between 0-1
     */
    beta(a, b) {
        // a, b greater-than 0
        let alpha = a + b
        let beta = 0.0
        let u1, u2, w, v = 0.0

        if (Math.min(a, b) <= 1.0) {
            beta = Math.max(1 / a, 1 / b)
        } else {
            beta = Math.sqrt((alpha - 2.0) / (2 * a * b - alpha))
        }

        let gamma = a + 1 / beta;

        while (true) {  // no! add a sanity counter!
            u1 = this.rng();
            u2 = this.rng();
            v = beta * Math.log(u1 / (1 - u1));
            w = a * Math.exp(v);
            let tmp = Math.log(alpha / (b + w));
            if (alpha * tmp + (gamma * v) - 1.3862944 >= Math.log(u1 * u1 * u2)) {
                break;
            }
        }
        return w / (b + w)
    }


    /**
     * Generate a random number according to a binomial distribution
     * 
     * @param {number} n how many random events
     * @param {number} p the probability of a single event is successful
     * @returns a the number of successes
     */
    binomial(n, p) {
        let successes = 0
        for (let i = 0; i < n; i++) {
            if (this.bernoulli(p)) {
                successes += 1
            }
        }

        return successes
    }


}
