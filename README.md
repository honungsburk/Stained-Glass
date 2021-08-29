# Stained Glass

Stained Glass is a generative art project made by me. 
Check it out on [my website](https://www.frankhampusweslien.com/art?group=Stained%20Glass&search=&forSale=False)

## The idea

The algorithm is centered around the idea of splitting triangles recursively.
It has three different ways of doing (check out the code) and a couple of
other bells and whistles to create beautiful images.

It outputs SVG images. A perfect file format for ipfs and the blockchain since
it is resolution independent and will look just as good in 10 years as it does 
now.

## How do I run it?

Simply open the index.html in your web browser and you are good to go.
I recommend using a local webserver if you want to play around with it a bit more
since it will then create a new work of art on each reload of the page.

## How do I create an art piece in the original series?

Change these lines in the sketch.js file:

```javascript
// Create a random seed - If you want to use this script to regenerate your image
// simply uncomment and write your seed in the string.
const rand = Math.random().toString().substr(2, 8);
// const rand = "MY_SEED"
```

There is also a [youtube video](https://www.youtube.com/watch?v=_iRBven6B-c) that explains how to do it
