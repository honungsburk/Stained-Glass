class Triangle {
    constructor(a, b, c) {
        this.a = a
        this.b = b
        this.c = c
    }

    /**
     * 
     * @returns the center of the triangle
     */
    center() {
        return this.a.add(this.b).add(this.c).scale(1 / 3)
    }
}