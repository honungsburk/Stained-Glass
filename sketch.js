const CANVAS_SIZE_X = 1200
const CANVAS_SIZE_Y = 1200

/**
 * The setup function is run before anything else.
 */
function setup() {
    /**
     * Using SVG leads to smaller image sizes + infinite resolution! Perfect
     * when creating an NFT.
     */
    createCanvas(CANVAS_SIZE_X, CANVAS_SIZE_Y, SVG)
    // Since we want a static image we will turn off the looping.
    noLoop()
    rectMode(CENTER)//??? can be removed???
}

// Create a random seed - If you want to use this script to regenerate your image
// simply uncomment and write your seed in the string.
const rand = Math.random().toString().substr(2, 8);
// const rand = "MY_SEED"

function draw() {
    /**
     * We start by defining some pre-requisites for the split triangle algorithm.
     * An immediate problem occurs: an image is a rectangle but our algorithm can only
     * deal with triangles. To fix this issue we can simply split the image into
     * two triangles. 
     * 
     * We will also be using relative coordinates and then simply scale them when
     * we are drawing the final image.
     */
    let a = new Point2D(0, 0)
    let b = new Point2D(1, 0)
    let c = new Point2D(0, 1)
    let d = new Point2D(1, 1)
    let t1 = new Triangle(a, b, c)
    let t2 = new Triangle(d, b, c)
    
    let rng = new RNG(rand)

    // By randomly selecting a composition of strategies the algorithm will 
    // have more variation. The exact probabilities are not to important I simply
    // used what worked.
    let [split_strat, split_strat_name] = make_split_strat(rng) 
    console.log(split_strat_name)
    let [depth_strat, depth_strat_name] = make_depth_strat(rng) 
    console.log(depth_strat_name)
    let [dist_strat, dist_strat_name] = make_dist_strat(rng)
    console.log(dist_strat_name)
    let jitter_amount = rng.pickUniform([0, 0, 0, 0.05, 0.005, 0.1, 0.4])
    let jitter = with_jitter(rng, jitter_amount)
    console.log(`with_jitter(${jitter_amount})`)
    let palette = make_palette(rng)
    let strokeColor = make_strokeColor(rng)
    let strokeWeight = rng.pickFromWeightedList([{ weight: 8, value: 1 }, { weight: 1, value: 2 }])

    // Construct the upper triangle of the image
    let st1 = new SmartTree(t1, split_strat, depth_strat, 0)
    st1.split()

    st1.dfs(draw_color_leaf(rng, CANVAS_SIZE_X, CANVAS_SIZE_Y, dist_strat, jitter, palette, strokeColor, strokeWeight))

    /**
     * 30% of the time we reset the random number generator. This causes the two 
     * triangles that make our image identical. Humans like symmetry :)
     * 
     * Why are the strategies also created again if they are just will end up being the same
     * you ask? Well, it is because we need the get the random number generator 
     * to the correct state when it builds the image and draws the tree.
     */
    if (rng.bernoulli(0.3)) {
        rng = new RNG(rand)

        let [split_strat_2, split_strat_name_2]  = make_split_strat(rng)
        split_strat = split_strat_2
        let [depth_strat_2, depth_strat_name_2] = make_depth_strat(rng)
        depth_strat = depth_strat_2
        let [dist_strat_2, dist_strat_name_2] = make_dist_strat(rng)
        dist_strat = dist_strat_2

        jitter = with_jitter(rng, rng.pickUniform([0, 0, 0, 0.05, 0.005, 0.1, 0.4]))
        palette = make_palette(rng)
        strokeColor = make_strokeColor(rng)
        let strokeWeight = rng.pickFromWeightedList([{ weight: 8, value: 1 }, { weight: 1, value: 2 }])
    }

    // Construct the lower triangle of the image
    let st2 = new SmartTree(t2, split_strat, depth_strat, 0)
    st2.split()


    st2.dfs(draw_color_leaf(rng, CANVAS_SIZE_X, CANVAS_SIZE_Y, dist_strat, jitter, palette, strokeColor, strokeWeight))

}

/**
 * Save image to disk. 
 */
function save_image(){
    save("Seed=" + rand + ".svg")
}


function make_split_strat(rng) {
    return rng.pickFromWeightedList([ { weight: 1, value: [split_random(rng), "split_random"] }
                                    , { weight: 2, value: [split_random_balanced(rng), "split_random_balanced"] }
                                    , { weight: 1, value: [split_middle, "split_middle"] }
                                    ])
}

/**
 * 
 * This splitting strategy is responsible for making the symmetric splitting.
 * 
 * @param {json} triangle 
 */
function split_middle(triangle) {
    //find the longest side
    let origin = new Point2D(0, 0)
    let lab = triangle.a.minus(triangle.b).distance_to(origin)
    let lac = triangle.a.minus(triangle.c).distance_to(origin)
    let lbc = triangle.b.minus(triangle.c).distance_to(origin)


    if (lab > lac && lab > lbc) {
        let d = triangle.a.add(triangle.b).scale(0.5)
        return [new Triangle(triangle.c, triangle.a, d), new Triangle(triangle.c, triangle.b, d)]
    }

    if (lac > lab && lac > lbc) {
        let d = triangle.a.add(triangle.c).scale(0.5)
        return [new Triangle(triangle.b, triangle.a, d), new Triangle(triangle.b, triangle.c, d)]
    }

    let d = triangle.b.add(triangle.c).scale(0.5)
    //find the middle point on the other side
    return [new Triangle(triangle.a, triangle.b, d), new Triangle(triangle.a, triangle.c, d)]
}

/**
 * This splitting strategy created the more 'spiky' images.
 * 
 * @param {RNG} rng 
 * @returns 
 */
function split_random(rng) {
    return function (triangle) {
        let cut = rng.truncated_gaussian(0.5, 1, 0.1, 0.9)
        let choice = rng.random()
        if (choice < 1 / 3) {
            let d = triangle.a.minus(triangle.b).scale(cut).add(triangle.b)
            return [new Triangle(triangle.c, triangle.a, d), new Triangle(triangle.c, triangle.b, d)]
        }

        if (choice < 2 / 3) {
            let d = triangle.a.minus(triangle.c).scale(cut).add(triangle.c)
            return [new Triangle(triangle.b, triangle.a, d), new Triangle(triangle.b, triangle.c, d)]
        }

        let d = triangle.b.minus(triangle.c).scale(cut).add(triangle.c)
        //find the middle point on the other side
        return [new Triangle(triangle.a, triangle.b, d), new Triangle(triangle.a, triangle.c, d)]
    }
}

/**
 * This splitting strategy creates the randomly split triangles, but not 
 * the spiky ones.
 * 
 * @param {RNG} rng 
 * @returns 
 */
function split_random_balanced(rng) {
    return function (triangle) {
        let cut = rng.truncated_gaussian(0.5, 1, 0.1, 0.9)
        //find the longest side
        let origin = new Point2D(0, 0)
        let lab = triangle.a.minus(triangle.b).distance_to(origin)
        let lac = triangle.a.minus(triangle.c).distance_to(origin)
        let lbc = triangle.b.minus(triangle.c).distance_to(origin)


        if (lab > lac && lab > lbc) {
            let d = triangle.a.minus(triangle.b).scale(cut).add(triangle.b)
            return [new Triangle(triangle.c, triangle.a, d), new Triangle(triangle.c, triangle.b, d)]
        }

        if (lac > lab && lac > lbc) {
            let d = triangle.a.minus(triangle.c).scale(cut).add(triangle.c)
            return [new Triangle(triangle.b, triangle.a, d), new Triangle(triangle.b, triangle.c, d)]
        }
        let d = triangle.b.minus(triangle.c).scale(cut).add(triangle.c)
        //find the middle point on the other side
        return [new Triangle(triangle.a, triangle.b, d), new Triangle(triangle.a, triangle.c, d)]

    }
}

////// Stroke Color //////

function make_strokeColor(rng) {
    // Since I put a one here it is practically disabled
    // I simply didn't think it looked good.
    if (rng.bernoulli(1)) {
        return (color) => color
    } else {
        return (_) => 256
    }
}


////// Depth //////

function make_depth_strat(rng) {

    let m_depth = rng.uniformInteger(7, 12)
    let max_depth_string = `max_depth(${m_depth})`

    let p = rng.truncated_gaussian(0.1, 0.2, 0, 0.2)
    let depth2 = rng.uniformInteger(5, 9)
    let flip_depth_string = `flip_depth(${p}, ${depth2})`
    let flip_depth = coin_flip_depth(rng, p,depth2 )

    let depth3 = rng.uniformInteger(3, 5)
    let in_depth = inherited_depth(rng, depth3)
    let inherited_depth_string = `inherited_depth(${depth3})`
    return rng.pickUniform([[max_depth(m_depth), max_depth_string], [flip_depth, flip_depth_string], [in_depth, inherited_depth_string]])
}


/**
 * The simplest strategy: True until you reach the max allowed depth.
 * 
 * @param {number} depth the maximum depth allowed
 */
function max_depth(depth) {
    let f = function (current_depth) {
        return { result: current_depth <= depth, callBack: f }
    }
    return f
}

/**
 * Has a maximum depth and then each triangle has a probability of going beyond that
 * Of course this will create two new triangles that also get that probability...
 * 
 * @param {RNG} rng the random number generator
 * @param {number} p the probability of going one step deeper 
 * @param {*} max_depth the max depth
 * @returns 
 */
function coin_flip_depth(rng, p, max_depth) {
    let f = function (current_depth) {
        return { result: current_depth <= max_depth || rng.bernoulli(p), callBack: f }
    }

    return f
}

/**
 * Starts with a minimum depth and then in each first call randomly extend that
 * minimum depth.
 * 
 * @param {RNG} rng the random number generator
 * @param {*} min_depth the minimum depth
 * @returns 
 */
function inherited_depth(rng, min_depth) {
    let f = function (current_depth) {
        if (min_depth <= current_depth) {
            let max_depth = rng.binomial(11, 0.6) + min_depth

            let cb = function (current_depth_2) { return { result: current_depth_2 <= max_depth, callBack: cb } }

            return { result: current_depth <= max_depth, callBack: cb }
        } else {
            return { result: true, callBack: f }
        }

    }

    return f
}

////// Draw //////

/**
 * 
 * @param {RNG} rng the random number generator
 * @param {number} size_x the pixel size of the final image in the x direction 
 * @param {number} size_y the pixel size of the final image in the y direction 
 * @param {*} distance the function used to calculate the distance which decides the color
 * @param {*} jitter adds jitter to the distance
 * @param {*} palette call back that given a number spits out a color
 * @param {*} strokeColor given a color returns a color
 * @param {*} strokeW 
 * @returns 
 */
function draw_color_leaf(rng, size_x, size_y, distance, jitter, palette, strokeColor, strokeW) {
    return function (smartTree) {
        if (smartTree.isLeaf()) {
            let x1 = smartTree.triangle.a.x * size_x
            let x2 = smartTree.triangle.b.x * size_x
            let x3 = smartTree.triangle.c.x * size_x
            let y1 = smartTree.triangle.a.y * size_y
            let y2 = smartTree.triangle.b.y * size_y
            let y3 = smartTree.triangle.c.y * size_y

            let color = palette(jitter(distance(smartTree.triangle)) * 3)

            fill(color)
            stroke(strokeColor(color))
            strokeWeight(strokeW);
            triangle(x1, y1, x2, y2, x3, y3)


        }
    }
}

////// Palette //////

/**
 * 
 * @param {RNG} rng a random number generator 
 * @returns a cosine palette taking in a number and spitting out a color
 */
function make_palette(rng) {

    let levels = [0, 1 / 5, 2 / 5, 3/5, 4/5, 1]
    let b_picks = [1/4, 1/2, 3/4]
    let c_picks = [2 / 5, 3/5, 4/5, 1]
    args = {
        red: { a: rng.pickUniform(levels), b: rng.pickUniform(b_picks) + rng.truncated_gaussian(0.125, 0.5, 0.05, 0.2), c: rng.pickUniform(c_picks), d: rng.pickUniform(levels) },
        green: { a: rng.pickUniform(levels), b: rng.pickUniform(b_picks)+ rng.truncated_gaussian(0.125, 0.5, 0.05, 0.2), c: rng.pickUniform(c_picks), d: rng.pickUniform(levels) },
        blue: { a: rng.pickUniform(levels), b: rng.pickUniform(b_picks)+ rng.truncated_gaussian(0.125, 0.5, 0.05, 0.2), c: rng.pickUniform(c_picks), d: rng.pickUniform(levels) },
    }
    


    let mode = rng.pickFromWeightedList([{ weight: 9, value: "SMOOTH" }, { weight: 1, value: "MOD" }])

    return cosine_palette(args, mode)
}


////// Jitter //////

/**
 * 
 * By adding some randomness when assigning colors to the triangles some very
 * nice and pleasing effects can be achieved.
 * 
 * @param {RNG} rng the random number generator to use 
 * @param {number} magnitude number between 0-1
 * @returns a function that jitters its inputs
 */
function with_jitter(rng, magnitude) {
    return function (val) {
        let lower = val - magnitude
        if (lower < 0) {
            lower = 0
        }
        let upper = val + magnitude
        if (upper > 1) {
            upper = 1
        }
        let out = rng.uniform(lower, upper)
        return out
    }
}

////// Triangle Distance Metric //////

function make_dist_strat(rng) {
    return rng.pickUniform([[x_centroid, "x_centroid"], [y_centroid, "y_centroid"], [dist_to_random(rng), "dist_to_random"], [dist_to_middle, "dist_to_middle"]])
}

/**
 * 
 * @param {triangle} triangle 
 * @returns returns the x coordinate of the triangle's centroid
 */
function x_centroid(triangle) {
    return triangle.center().x
}

/**
 * 
 * @param {triangle} triangle 
 * @returns returns the y coordinate of the triangle's centroid
 */
function y_centroid(triangle) {
    return triangle.center().y
}

var dist_to_middle = dist_to_centroid(new Point2D(0.5, 0.5))

/**
 * 
 * @param {RNG} rng 
 * @returns the euclidean distance of a triangle's centroid to a random point.
 */
function dist_to_random(rng) {
    let rndPoint = new Point2D(rng.random(), rng.random())
    return dist_to_centroid(rndPoint)
}

/**
 * 
 * @param {Point} other 
 * @returns a function that calculates the euclidean distance between a triangle
 * and the given Point. 
 */
function dist_to_centroid(other) {
    return function (triangle) {
        return triangle.center().distance_to(other)
    }
}


////// SmartTree //////

/**
 * Performs the recursive splitting of triangles. It takes two call backs: 
 * split_strategy and depth_strategy. That allow us to reuse the class for 
 * multiple different approaches.
 */
class SmartTree {

    children = []

    constructor(triangle, split_strategy, depth_strategy, depth) {
        this.triangle = triangle
        this.split_strategy = split_strategy
        this.depth_strategy = depth_strategy
        this.depth = depth
    }

    /**
     * Recursively split the entire smart tree, will split forever if the depth_strategy
     * allows it.
     */
    split() {
        let res = this.depth_strategy(this.depth)
        if (res.result) {
            for (const sub_triangle of this.split_strategy(this.triangle)) {
                let st = new SmartTree(sub_triangle, this.split_strategy, res.callBack, this.depth + 1)
                st.split()
                this.children.push(st)
            }

        }
    }

    /**
     * the action is executed on the leafs first
     * The action gets access to the smart tree. Pro Tip: Do not modify the smart tree!!!
     * 
     * @param {function(SmartTree)} action function to call while exploring the tree
     */
    dfs(action) {
        for (const child of this.children) {
            child.dfs(action)
        }
        action(this)
    }


    /**
     * 
     * @returns whether or not the node is a leaf
     */
    isLeaf() {
        return this.children.length === 0
    }
}
