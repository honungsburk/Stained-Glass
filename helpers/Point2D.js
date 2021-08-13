class Point2D {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    /**
     * 
     * @param {Point2D} other the other point to add 
     * @returns a new Point2D
     */
    add(other) {
        return new Point2D(this.x + other.x, this.y + other.y)
    }

    /**
     * 
     * @param {Point2D} other the other point to subtract 
     * @returns a new Point2D
     */
    minus(other) {
        return new Point2D(this.x - other.x, this.y - other.y)
    }

    /**
     * 
     * @param {number} factor to scale the point with
     * @returns a new Point2D
     */
    scale(factor) {
        return new Point2D(this.x * factor, this.y * factor)
    }

    /**
     * 
     * @param {Point2D} other 
     */
    distance_to(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2))
    }
}