class Calculation {
    constructor(documentID, username, stringCalculation, timestamp){
        this.documentID = documentID
        this.username = username
        this.stringCalculation = stringCalculation
        this.timestamp = timestamp
    }

    getDocumentID() {
        return this.documentID
    }

    getUsername(){
        return this.username
    }

    getStringCalculation(){
        return this.stringCalculation
    }

    getTimestamp() {
        return this.timestamp
    }
}

class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement, historyTextElement) {
        this.previousOperandTextElement = previousOperandTextElement
        this.currentOperandTextElement = currentOperandTextElement
        this.historyTextElement = historyTextElement
        this.clear()
    }

    clear() {
        this.currentOperand = ''
        this.previousOperand = ''
        this.operation = undefined
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1)
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return
        this.currentOperand = this.currentOperand.toString() + number.toString()
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return
        if (this.previousOperand !== '') {
            this.compute()
        }
        this.operation = operation
        this.previousOperand = this.currentOperand
        this.currentOperand = ''
    }

    compute() {
        let computation
        const prev = parseFloat(this.previousOperand)
        const current = parseFloat(this.currentOperand)
        if (isNaN(prev) || isNaN(current)) return
        switch (this.operation) {
            case '+':
                computation = prev + current
                break
            case '-':
                computation = prev - current
                break
            case '*':
                computation = prev * current
                break
            case '÷':
                computation = prev / current
                break
            default:
                return
        }
        this.firestoreAddCalculation(prev, current, computation, this.operation)
        this.currentOperand = computation
        this.operation = undefined
        this.previousOperand = ''
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString()
        const integerDigits = parseFloat(stringNumber.split('.')[0])
        const decimalDigits = stringNumber.split('.')[1]
        let integerDisplay
        if (isNaN(integerDigits)) {
            integerDisplay = ''
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 })
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`
        } else {
            return integerDisplay
        }
    }

    updateOutput() {
        this.currentOperandTextElement.innerText =
            this.getDisplayNumber(this.currentOperand)
        if (this.operation != null) {
            this.previousOperandTextElement.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`
        } else {
            this.previousOperandTextElement.innerText = ''
        }
    }

    updateHistory(calculations) {
        var historyString = ""

        for (var i = 0; i < calculations.length; i++) {
            historyString += calculations[i].getUsername() + ":  " + calculations[i].getStringCalculation() + "\n"
        }
        console.log(historyString)
        this.historyTextElement.innerText = historyString
        if (this.operation != null) {
            this.previousOperandTextElement.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`
        } else {
            this.previousOperandTextElement.innerText = ''
        }
    }

    // Gets calculations from Firestore
    firestoreGetCalculations() {
        var calculations = new Array()
        var i = 0

        db.collection("calculations").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let calculationObj = new Calculation(doc.id, doc.data().username, doc.data().calculation, doc.data().timestamp)
                calculations.push(calculationObj)
            });

            // Sort to ascending order
            calculations.sort(function(a, b) {
                return a.timestamp - b.timestamp;
            });
            // calculations.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1 )

            // Check length of set, no more than 10 calculations!
            while (calculations.length > 10) {
                this.firestoreRemoveCalculation(calculations[0].documentID)
                calculations.splice(0, 1)
            }

            this.updateHistory(calculations)
        });


    }

    firestoreRemoveCalculation(docID){
        db.collection("calculations").doc(docID).delete().then(() => {
            console.log("Document successfully deleted!")
        }).catch((error) => {
            console.error("Error removing document: ", error)
        });
    }

    firestoreAddCalculation(prev, current, computation, operator){
        db.collection("calculations").add({
            username: username,
            timestamp: Date.now(),
            calculation: "" + prev + " " + operator + " " + current + " = " + computation
        })
            .then(() => {
                console.log("Document successfully written!")
            })
            .catch((error) => {
                console.error("Error writing document: ", error)
            });
    }

}

const numberButtons = document.querySelectorAll('[data-num]')
const operationButtons = document.querySelectorAll('[data-op]')
const equalsButton = document.querySelector('[data-equals]')
const deleteButton = document.querySelector('[data-del]')
const allClearButton = document.querySelector('[data-ac]')
const previousOperandTextElement = document.querySelector('[data-last-op]')
const currentOperandTextElement = document.querySelector('[data-current-op]')
const historyTextElement = document.querySelector('[data-history]')
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement, historyTextElement)

const username = window.prompt("Please type in a username:")
var x = 0

window.onload = function() {
    calculator.firestoreGetCalculations()
};

db.collection("calculations").onSnapshot(() => {
    calculator.firestoreGetCalculations()
})

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (x == 1) {
            x = 0
            calculator.clear()
            calculator.appendNumber(button.innerText)
            calculator.updateOutput()
        } else if (x == 0) {
            calculator.appendNumber(button.innerText)
            calculator.updateOutput()
        } else {
            calculator.appendNumber(button.innerText)
            calculator.updateOutput()
        }
    })
})

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        x = 0
        calculator.chooseOperation(button.innerText)
        calculator.updateOutput()
    })
})

equalsButton.addEventListener('click', button => {
    x = 1
    calculator.compute()
    calculator.updateOutput()
    calculator.firestoreGetCalculations()
})

allClearButton.addEventListener('click', button => {
    calculator.clear()
    calculator.updateOutput()
})

deleteButton.addEventListener('click', button => {
    calculator.delete()
    calculator.updateOutput()
})


