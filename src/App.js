import { useReducer, useCallback } from "react"
import DigitButton from "./DigitButton"
import OperationButton from "./OperationButton"
import "./styles.css"

export const ACTIONS = {
  ADD_ELEMENT: "add-digit",
  ADD_OPERATION: "add-operation",
  GET_RESULT_OPERATION: "get-result-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
  OPERATION_EVALUATE: "operation-evaluate"
}

function reducer(state, { type, payload }) {	
	switch (type) {
    case ACTIONS.ADD_DIGIT:	
		if (state.overwrite) {
			if (payload.digit === "rep") {
				return {
					...state,
					operation: null,
					currentOperand: "repeat ",
					calculationResult: state.calculationResult,
					listOperand: [],
					listOperation: [],
					overwrite: false
				}
			}
			
			return {
			...state,
			currentOperand: payload.digit,
			overwrite: false,
			}
      	}
		if (payload.digit === "0" && state.currentOperand === "0") {
			return state
		}
		if (payload.digit === "." && state.currentOperand.includes(".")) {
			return state
		}

		if (payload.digit === "-.." && state.currentOperand) {
			return state
		}

		if (payload.digit === "-..") {
			payload.digit = "-"
		}

		if (payload.digit === "rep") {
			return state
		}

	  	if (state.operation) {
			const newListOperation = [...state.listOperation]
			newListOperation.push(state.operation)
			
			return {
				...state,
				currentOperand: `${state.currentOperand || ""}${payload.digit}`,
				listOperation: newListOperation,
				operation: null
			  }
		} else {			
			return {
				...state,
				currentOperand: `${state.currentOperand || ""}${payload.digit}`,
			  }
		}
    case ACTIONS.ADD_OPERATION:
		if (state.currentOperand || (state.currentOperand === 0 && !state.calculationResult)) {
			const newListOperand = [...state.listOperand, state.currentOperand]
			return {
				...state,
				operation: payload.operation,
				listOperand: newListOperand,
				currentOperand: null
			}
		} else if (state.calculationResult) {
			return {
				...state,
				overwrite: false,
				operation: payload.operation,
				currentOperand: null,
				listOperand: [state.calculationResult],
				calculationResult: null
			}
		} else {
			return {
				...state,
				operation: payload.operation,
			}
		}
    case ACTIONS.CLEAR:
      	return {currentOperand: 0, listOperand: [], listOperation: [], listCalculation: []}
    case ACTIONS.DELETE_DIGIT:
      	if (state.overwrite) {
        	return {
				...state,
				overwrite: false,
        	}
      	}
      	if (state.currentOperand === 0) return state
		if (state.currentOperand == null && state.listOperand.length > 0) {
			const newListOperand = [...state.listOperand]
			newListOperand.splice(-1)
			return { ...state, operation: null, currentOperand: state.listOperand[state.listOperand.length-1], listOperand: newListOperand }
		}
		if (state.currentOperand.length === 0 && state.listOperation.length > 0 && state.listOperand.length > 0) {
			let operandToBeRemoved = state.listOperand[state.listOperand.length - 1]
			let newListOperation = [...state.listOperation]
			let newListOperand = [...state.listOperand]
			newListOperation.splice(-1)
			newListOperand.splice(-1)
			return { ...state, operation: null, currentOperand: `${operandToBeRemoved}`, listOperation: newListOperation, listOperand: newListOperand}
		}

		if (state.currentOperand.length === 1 && state.listOperation.length === 0) return { ...state, currentOperand: 0}

      	return {
        	...state,
        	currentOperand: state.currentOperand.slice(0, -1),
      	}
    case ACTIONS.EVALUATE:
      	if (!state.operation && !state.currentOperand) {
        	return state
      	}

		return {
			...state,
			overwrite: true,
			operation: null,
			currentOperand: 0,
			calculationResult: payload.calculationResult,
			listOperand: [],
			listOperation: []
		}
	case ACTIONS.OPERATION_EVALUATE:
		  
		  return {
			  ...state,
			  overwrite: true,
			  operation: null,
			  currentOperand: 0,
			  calculationResult: trimCalculationResult(payload.calculationResult)
		  }
			
	default:
		return
  }
}

function trimCalculationResult(result) {
	if (result.length > 18) {
		return result.slice(0,18)
	} 
	return result
}

function evaluate(currentOperand, operation, listOperand, listOperation, calculationResult, overwrite) {
	if (calculationResult && overwrite) {
		return calculationResult
	}

	let res = []
	for (let i = 0; i < listOperand.length; i++) {
		res.push(listOperand[i], listOperation[i])
	}

	return res.join(" ") + ` ${currentOperand || currentOperand === 0 ? currentOperand : ''} ${operation ? operation : ''}`
}

function App() {
  const [{ currentOperand, operation, listOperand, listOperation, calculationResult, listCalculation, overwrite }, dispatch] = useReducer(
    reducer,
    {currentOperand: 0, listOperand: [], listOperation: [], listCalculation: []}
  )

  const createCalculationSingleInput = useCallback(async (content) => {
			
	let operator 

	switch(content.target.innerHTML) {
		case "|x|":
			operator = "abs"
			break;
		case "-x":
			operator = "neg"
			break;
		case "x²":
			operator =  "sqr"
			break;
		case "√x":
			operator = "sqrt"
			break;
		case "x³":
			operator = "cube"
			break;
		case "∛x":
			operator = "cubert"
			break;
		default:
			return
	}

	let input = evaluate(currentOperand, operation, listOperand, listOperation, overwrite).split(" ")
	input = input.filter(n => n)
	const inputCombined = input.join(" ")
	
	const requestOptions = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ input: `${operator} ${calculationResult ? calculationResult : inputCombined}`})
	};

	try {
		const res = await fetch('https://asia-southeast2-serverless-calculator.cloudfunctions.net/serverless-calculator/calculation', requestOptions)

		const result = await res.json()

		if (result.error_code) {
			throw new Error(`${result.error_code}: ${result.error_message}`)
		}

		listCalculation.push(result.input)

		dispatch({ type: ACTIONS.OPERATION_EVALUATE,  payload: { calculationResult: result.result } })
	} catch(e) {
		alert(e.message)
	}
	
  }, [currentOperand, operation, listOperand, listOperation, calculationResult, listCalculation, overwrite])

  const createCalculation = useCallback(async () => {	
	if (currentOperand && currentOperand.split(" ")[0] === "repeat") {
		const history = currentOperand.split(" ")[1]
		if (listCalculation.length >= parseInt(history)) {
			const operation = listCalculation[listCalculation.length - parseInt(history)].split(" ")
			let input
			if (["abs", "neg", "sqr", "sqrt", "cube", "cubert"].includes(operation[0])) {
				input = `${operation[0]} ${calculationResult}`
			} else {
				operation[0] = calculationResult
				input = operation.join(" ")
			}

			const requestOptions = {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ input: input })
			};

			try {
				const res = await fetch('https://asia-southeast2-serverless-calculator.cloudfunctions.net/serverless-calculator/calculation', requestOptions)

				const result = await res.json()

				if (result.error_code) {
					throw new Error(`${result.error_code}: ${result.error_message}`)
				}

				listCalculation.push(result.input)

				dispatch({ type: ACTIONS.EVALUATE,  payload: { calculationResult: result.result } })

				return
			} catch (e) {
				alert(e.message)

				return
			}
		} else {
			alert("Your calculation history is less than your input")

			return
		}
	}
	
	let input = evaluate(currentOperand, operation, listOperand, listOperation, overwrite).split(" ")
	input = input.filter(n => n)

	const inputMapped = input.map((i) => {
		switch(i) {
			case "+":
				return "add"
			case "-":
				return "subtract"
			case "*":
				return "multiply"
			case "÷":
				return "divide"
			default:
				return i
		}
	})

	const inputCombined = inputMapped.join(" ")
	const requestOptions = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ input: inputCombined })
	};

	try {
		const res = await fetch('https://asia-southeast2-serverless-calculator.cloudfunctions.net/serverless-calculator/calculation', requestOptions)

		const result = await res.json()

		if (result.error_code) {
			throw new Error(`${result.error_code}: ${result.error_message}`)
		}

		listCalculation.push(result.input)

		dispatch({ type: ACTIONS.EVALUATE,  payload: { calculationResult: result.result } })
	} catch (e) {
		alert(e.message)
	}
	

  }, [currentOperand, operation, listOperand, listOperation, listCalculation, calculationResult, overwrite])

  return (
    <div className="calculator-grid">
      <div className="output">
        <div className="current-operand">{evaluate(currentOperand, operation, listOperand, listOperation, calculationResult, overwrite)}</div>
      </div>
      <button
        className="span-two"
        onClick={() => dispatch({ type: ACTIONS.CLEAR })}
      >
        AC
      </button>
      <button onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}>
        DEL
      </button>
      <OperationButton operation="÷" dispatch={dispatch} />
      <DigitButton digit="1" dispatch={dispatch} />
      <DigitButton digit="2" dispatch={dispatch} />
      <DigitButton digit="3" dispatch={dispatch} />
      <OperationButton operation="*" dispatch={dispatch} />
      <DigitButton digit="4" dispatch={dispatch} />
      <DigitButton digit="5" dispatch={dispatch} />
      <DigitButton digit="6" dispatch={dispatch} />
      <OperationButton operation="+" dispatch={dispatch} />
      <DigitButton digit="7" dispatch={dispatch} />
      <DigitButton digit="8" dispatch={dispatch} />
      <DigitButton digit="9" dispatch={dispatch} />
      <OperationButton operation="-" dispatch={dispatch} />
	  <button onClick={createCalculationSingleInput}>|x|</button>
	  <button onClick={createCalculationSingleInput}>-x</button>
	  <button onClick={createCalculationSingleInput}>x²</button>
	  <button onClick={createCalculationSingleInput}>√x</button>
	  <DigitButton digit="rep" dispatch={dispatch} />
	  <DigitButton digit="-.." dispatch={dispatch} />
	  <button onClick={createCalculationSingleInput}>x³</button>
	  <button onClick={createCalculationSingleInput}>∛x</button>
      <DigitButton digit="." dispatch={dispatch} />
      <DigitButton digit="0" dispatch={dispatch} />
      <button
        className="span-two"
        onClick={createCalculation}
      >
        =
      </button>
    </div>
  )
}

export default App