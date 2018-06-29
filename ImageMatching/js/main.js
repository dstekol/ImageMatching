/*
 * Overall structure: 
 * vars initialized in global script
 * compileResources called to initialize image and vector arrays
 * setup() is called to put everything in place for the animation
 *  setup starts a repeating call to processRow using setInterval
 * processRow() performs the calculations for each row using cosineSimilarity() 
 *  once the best match for each image is found, it is moved to the corresponding column with moveImg()
 *  the best match so far is recorded in maxSimInd, and the similarity slider is updated
 *  the top row of images is moved back to its original position with resetImgs
 *  the current row is collapsed with collapse() so the animation can move on
 * Once processRow is called enough times, it is stopped with clearInterval()
 * displayBestMatch() ranks the rows of native words based on similarity
 * Once the animation is complete, setup() can be called again to restart it
 * 
 * 
 * */






var foreignPics = [];
var foreignPicVects = [];
var nativePics = [];
var nativePicVects = [];
var nativeWords = []; 

//keeps track of row that is being processed
var row;

//total number of columns (pictures for each word) - shouldn't change because layout will be messed up
var numCols = 10; 

//keeps track of maximum similarity
var maxSim;

//used for image offsets (so they don't all pile on top of each other)
var sampleMatch = [];

//keeps track of how similar each row of native images is to the foreign images
var simTracker = [0,0,0,0,0,0,0,0,0,0];

//the index of the row with the max similarity to the foreign word
var maxSimInd = 0;

var body = d3.select("body");
var div = body.select("#animation");

//top row of pictures (for foreign word)
var sample;

// id of the process launched by setInterval (used to stop the process)
var process=-1;

nativeWords = ["owl", "tree", "raccoon", "silver", "cat", "tractor", "dog", "kittens", "city", "dolphin"];

compileResources();

/**
 * Initializes image array and begins animation
 * */
function setup() {
    d3.select("#playbutton").style("display", "none");


    //positions native images in 10 rows initial order
    for (var i = 0; i < numCols; i++) {
        for (var j = 0; j < nativePics.length; j++) {
            div.selectAll(".row" + i).style("top", i + "0%");
        }
    }

    resetImgs();
    row = 0;
    maxSim = 0;

    //starts animation
    process = setInterval(processRow, 3900);
    processRow();
    
}






/**
 *Performs animation sequence for top current row (specified by "row" variable)
 */
function processRow() {

    //initializes vars
    var img;
    for (var i = 0; i < numCols; i++) {
        sampleMatch[i] = 0;
    }
    var simAccum = 0;
    var imageSimilarity = 0;
    var matchInd;
    var moveArray = [0,0,0,0,0,0,0,0,0,0];

    //finds best match by calculating similarity
    for (var i = 0; i < numCols; i++) {
        //can be changed to MAXMAX or AVGAVG comparison methods
        moveArray[i] = bestMatch_MAXAVG(i, row);
    }

    //moves each image to its best match
    for (var i = 0; i < numCols; i++) {
        img = sample.select("#samp" + i);
        moveImg(img, moveArray[i]);
    }

    
    //updates slider
    //sample.select("#slider").transition().duration(1000).attr("value", imageSimilarity);
    document.getElementById("slider").value = imageSimilarity;
    sample.select("#sliderlabel").text(Math.round(imageSimilarity*1000)/1000);

    //checks whether the newly calculated similarity is max so far (and if so, updates max slider)
    if (imageSimilarity > maxSim) {
        maxSimInd = row;
        maxSim = imageSimilarity;
        sample.select("#slidemax").transition().duration(1000).attr("value", imageSimilarity);
    }

    //records the similarity of this row to the foreign images
    simTracker[row] = imageSimilarity;

    //moves top row (foreign images) back to their original spots
    setTimeout(resetImgs, 1500);

    //stops the animation if all rows have been processed
    if (row == 9) {
        clearInterval(process);
    }

    //collapses the current row of native images so the next row can be processed
    setTimeout(collapse, 2000);

    /**
     *Finds the image in the current row that best matches the given sample image
     * @param {Number} ind the index of the sample image to find a match for
     */
    function bestMatch_MAXAVG(ind) {
        var bestMatchSim = 0;
        var bestMatchIndex = 0;
        var tempSimilarity;
        var similaritySum = 0;

        //loops through current row, computing similarity for each element
        for (var i = 0; i < nativePicVects[row].length; i++) {
            tempSimilarity = cosSim(foreignPicVects[ind], nativePicVects[row][i]);
            similaritySum += tempSimilarity;
            if (tempSimilarity > bestMatchSim) {
                bestMatchSim = tempSimilarity;
                bestMatchIndex = i;
            }
        }

        //updates global similarity indicator
        var avgSim = similaritySum / numCols;
        if(avgSim > imageSimilarity){
            imageSimilarity = avgSim;
        }
        return bestMatchIndex;
    }


    function bestMatch_MAXMAX(ind) {
        var bestMatchSim = 0;
        var bestMatchIndex = 0;
        var tempSimilarity;

        //loops through current row, computing similarity for each element
        for (var i = 0; i < nativePicVects[row].length; i++) {
            tempSimilarity = cosSim(foreignPicVects[ind], nativePicVects[row][i]);
            if (tempSimilarity > bestMatchSim) {
                bestMatchSim = tempSimilarity;
                bestMatchIndex = i;
            }
        }

        //updates global similarity indicator
        if (bestMatchSim > imageSimilarity) {
            imageSimilarity = bestMatchSim;
        }
        
        return bestMatchIndex;
    }

    function bestMatch_AVGAVG(ind) {
        var bestMatchSim = 0;
        var bestMatchIndex = 0;
        var tempSimilarity;

        //loops through current row, computing similarity for each element
        for (var i = 0; i < nativePicVects[row].length; i++) {
            tempSimilarity = cosSim(foreignPicVects[ind], nativePicVects[row][i]);
            simAccum += tempSimilarity;
            if (tempSimilarity > bestMatchSim) {
                bestMatchSim = tempSimilarity;
                bestMatchIndex = i;
            }
        }

        //updates global similarity indicator
        tempSimilarity += bestMatchSim;
        imageSimilarity = simAccum / (numCols * numCols);
        return bestMatchIndex;
    }
}



/**
 * Generates random integer in specified range (inclusive)
 *
 * @param {any} min minimum of random range
 * @param {any} max maximum of random range
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Moves the passed image object to the specified column
 * @param {HTMLImageElement} img the image to move
 * @param {Number} ind the index of the column to move to
 */
function moveImg(img, ind) {
    img.transition().duration(500).style("left", ind + "0%").style("top", (45 - sampleMatch[ind] * 10) + "%");
    sampleMatch[ind]++;
}

/**
 * Returns top row (foreign sample) images back to original spots
 * Used at each step of animation 
 */
function resetImgs() {
    for (var i = 0; i < numCols; i++) {
        img = sample.select("#samp" + i);
        img.transition().duration(500).style("top", "0%").style("left", i + "0%");
    }
}

/**
Computes the cosine similarity of two vectors
@param arr1 the first vector
@param arr2 the second vector
@return cosine similarity
*/
function cosSim(arr1, arr2) {
    var dim = Math.min(arr1.length, arr2.length);
    var dotprod=0;
    var arr1Mag = 0;
    var arr2Mag = 0;
    for (var i = 0; i < dim; i++) {
        if (!isNaN(arr1[i]) && !isNaN(arr2[i])) {
            dotprod += arr1[i] * arr2[i];
            arr1Mag += arr1[i] * arr1[i];
            arr2Mag += arr2[i] * arr2[i];
        }
    }
    arr1Mag = Math.sqrt(arr1Mag);
    arr2Mag = Math.sqrt(arr2Mag);
    var sim = dotprod / (arr1Mag * arr2Mag);
    return sim;
}

/**
 *Collapses the current top row and moves all other rows up a level
 */
function collapse() {
    div.selectAll(".row" + row).transition().duration(500).style("opacity", "0");
    row++;
    if (row >= numCols) {
        setTimeout(displayBestMatch, 1000);
    }
    for (var j = row; j < numCols; j++) {
        div.selectAll(".row" + j).transition().delay(250).duration(500).style("top", (j - row) + "0%");
    }   
}

/**
 * Once all comparisons have finished, ranks the native image rows in order of similarity
 * */
function displayBestMatch() {
    var simIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    //sorts row indices according to similarity
    simIndices.sort(function (a, b) {
        return simTracker[b] - simTracker[a];
    });

    //puts each row in its ranked spot
    for (var i = 0; i < numCols; i++) {
        div.selectAll(".row" + simIndices[i]).transition().duration(500).style("opacity", "1").style("top", i+"0%");
    }

    //updates slider with top similarity match
    sample.select("#slider").transition().duration(1000).attr("value", maxSim);
    sample.select("#sliderlabel").text(Math.round(maxSim * 1000) / 1000);

    setTimeout(function () { d3.select("#playbutton").style("display", "inline") }
        , 3000);
}

/**
 * sets up image array and vectors
 * */
function compileResources() {
    var temp, ind;
    var foreignWord = data.foreignword.word;
    for (var i = 0; i < numCols; i++) {
        foreignPics.push("images/f_" + foreignWord + "/" + data.foreignword.files[i]);
        foreignPicVects.push(data["foreignword"]["vectors"][i]);
    }

    d3.select("#foreignwordholder").text(foreignWord);

    var i = 0;
    for (word in data) {
        if (word != "foreignword") {
            nativePics.push([]);
            nativePicVects.push([]);

            //adds word label to image row
            div.append("div")
                .text(word + " ")
                .attr("class", "arrayimage wordcontainer row" + i)
                .style("top", i + "0%");
            
            for (var j = 0; j < data[word]["files"].length; j++) {
                nativePics[nativePics.length - 1].push("images/" + word + "/" + data[word]["files"][j]);
                nativePicVects[nativePicVects.length-1].push(data[word]["vectors"][j]);
            }
            i++;
        }
        
    }
    



    for (var i = 0; i < numCols; i++) {

        sample = body.select("#sample");

        //adds image to sample area (top)
        sample.append("img")
            .attr("src", foreignPics[i])
            .attr("class", "sampimage")
            .attr("id", "samp" + i)
            .style("left", i + "0%")
            .style("top", "0%");

        

        for (var j = 0; j < numCols; j++) {

            //adds row of images
            div.append("img")
                .attr("src", nativePics[i][j])
                .attr("class", "arrayimage row" + i)
                .style("top", i + "0%")
                .style("left", j + "0%");
        }
    }
    div.append("div").attr("id", "blurrer");
    d3.select("#playbutton").style("display", "inline");
}

/**
 * NOT USED ANYMORE
 * generates random vector of given dimension
 * @param {any} dim dimension (length) of vector to generate
 */
function generateVect(dim) {
    var arr = [];
    for (var i = 0; i < dim; i++) {
        arr.push(Math.random());
    }
    return arr;
}


