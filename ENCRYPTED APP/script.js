const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const imageUpload = document.getElementById("imageUpload");
const outputImage = document.getElementById("outputImage");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let keyMatrix = null; // Variable to store the encryption key matrix
let encryptedImageData = null; // Variable to store encrypted image data

// Function to prompt the user to set the key matrix for encryption
function setKeyMatrix() {
    const matrixSize = prompt("Enter the matrix size (2 for 2x2 or 3 for 3x3):");
    if (matrixSize !== "2" && matrixSize !== "3") {
        alert("Invalid matrix size. Please enter either 2 or 3.");
        return;
    }

    const size = parseInt(matrixSize);
    const matrix = [];

    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            const value = parseInt(prompt(`Enter value for matrix position [${i + 1}, ${j + 1}]:`));
            matrix[i][j] = value;
        }
    }

    if (isInvertible(matrix)) {
        keyMatrix = matrix;
        alert("Key matrix set successfully.");
    } else {
        alert("The entered matrix is not invertible. Please enter a valid matrix.");
    }
}

// Function to prompt user to enter the key matrix for decryption
function enterDecryptionKeyMatrix() {
    const matrixSize = keyMatrix.length; // Use the original matrix size
    const matrix = [];

    for (let i = 0; i < matrixSize; i++) {
        matrix[i] = [];
        for (let j = 0; j < matrixSize; j++) {
            const value = parseInt(prompt(`Enter value for matrix position [${i + 1}, ${j + 1}] for decryption:`));
            matrix[i][j] = value;
        }
    }

    return matricesEqual(matrix, keyMatrix) ? matrix : null;
}

// Check if two matrices are equal
function matricesEqual(matrix1, matrix2) {
    if (matrix1.length !== matrix2.length) return false;
    for (let i = 0; i < matrix1.length; i++) {
        for (let j = 0; j < matrix1[i].length; j++) {
            if (matrix1[i][j] !== matrix2[i][j]) return false;
        }
    }
    return true;
}

// Function to check if the matrix is invertible
function isInvertible(matrix) {
    const determinant = calculateDeterminant(matrix);
    return determinant !== 0;
}

// Function to calculate the determinant (only for 2x2 or 3x3 matrices)
function calculateDeterminant(matrix) {
    const size = matrix.length;
    if (size === 2) {
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    } else if (size === 3) {
        return (
            matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
            matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
            matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
        );
    }
    return 0;
}

// Handle image upload and store the original image data temporarily
imageUpload.addEventListener("change", () => {
    const file = imageUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;

            // Store the original image temporarily in localStorage
            localStorage.setItem("originalImageData", event.target.result);
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Display the uploaded (original) image
                outputImage.src = event.target.result;
                outputImage.style.display = "block";
            };
        };
        reader.readAsDataURL(file);
    }
});

// Function to apply the Hill Cipher encryption to image data
function hillCipherEncrypt(pixelData) {
    let encryptedData = new Uint8ClampedArray(pixelData.length);

    for (let i = 0; i < pixelData.length; i += 3) {
        let block = [pixelData[i] || 0, pixelData[i + 1] || 0, pixelData[i + 2] || 0];
        let encryptedBlock = matrixMultiply(keyMatrix, block, 256);

        encryptedData[i] = encryptedBlock[0];
        encryptedData[i + 1] = encryptedBlock[1];
        encryptedData[i + 2] = encryptedBlock[2];
        encryptedData[i + 3] = pixelData[i + 3]; // Preserve alpha channel
    }

    return encryptedData;
}

// Matrix multiplication for Hill Cipher encryption
function matrixMultiply(matrix, block, mod) {
    let result = [];
    for (let i = 0; i < matrix.length; i++) {
        result[i] = 0;
        for (let j = 0; j < block.length; j++) {
            result[i] += matrix[i][j] * block[j];
        }
        result[i] %= mod;
    }
    return result;
}

// Encrypt button event
encryptBtn.addEventListener("click", () => {
    const storedImage = localStorage.getItem("originalImageData");
    if (!storedImage) {
        alert("Please upload an image first.");
        return;
    }

    if (!keyMatrix) setKeyMatrix(); // Set key matrix if not already set
    if (keyMatrix) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;

        // Apply Hill Cipher encryption
        const encryptedBytes = hillCipherEncrypt(pixelData);
        encryptedImageData = new ImageData(encryptedBytes, canvas.width, canvas.height);

        // Display encrypted image on the screen
        ctx.putImageData(encryptedImageData, 0, 0);
        outputImage.src = canvas.toDataURL();
        outputImage.style.display = "block";

        alert("Image encrypted successfully.");
    }
});

// Decrypt button event - verifies the entered key matrix and displays the original image if correct
decryptBtn.addEventListener("click", () => {
    if (!encryptedImageData) {
        alert("No encrypted image found.");
        return;
    }

    const enteredKeyMatrix = enterDecryptionKeyMatrix();
    if (enteredKeyMatrix) {
        // Retrieve the original image from localStorage and display it
        const originalImage = localStorage.getItem("originalImageData");
        if (originalImage) {
            outputImage.src = originalImage; // Display the original image
            outputImage.style.display = "block";
            alert("Image decrypted successfully.");
        } else {
            alert("Original image not found.");
        }
    } else {
        alert("Incorrect key matrix. Please try again.");
    }
});
