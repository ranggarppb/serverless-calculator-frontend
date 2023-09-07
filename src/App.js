import { useReducer, useCallback } from "react"
import DigitButton from "./DigitButton"
import OperationButton from "./OperationButton"
import "./styles.css"

export const ACTIONS = {
  ADD_ELEMENT: "add-digit",
  ADD_OPERATION: "add-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
}

function reducer(state, { type, payload }) {
	switch (type) {
    case ACTIONS.ADD_DIGIT:
		if (state.overwrite) {
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
		if (state.currentOperand) {
			const newListOperand = [...state.listOperand, state.currentOperand]
			return {
				...state,
				operation: payload.operation,
				listOperand: newListOperand,
				currentOperand: null
			}
		} else {
			return {
				...state,
				operation: payload.operation,
			}
		}
    case ACTIONS.CLEAR:
      	return {currentOperand: 0, listOperand: [], listOperation: []}
    case ACTIONS.DELETE_DIGIT:
      	if (state.overwrite) {
        	return {
				...state,
				overwrite: false,
        	}
      	}
      	if (state.currentOperand === 0) return state
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
			calculationResult: payload.calculationResult
		}
			
	default:
		return
  }
}


function evaluate(currentOperand, operation, listOperand, listOperation, calculationResult) {
	if (calculationResult) {
		return calculationResult
	}

	console.log(currentOperand, operation, listOperand, listOperation)

	let res = []
	for (let i = 0; i < listOperand.length; i++) {
		res.push(listOperand[i], listOperation[i])
	}

	return res.join(" ") + ` ${currentOperand || currentOperand === 0 ? currentOperand : ''} ${operation ? operation : ''}`
}

function App() {
  const [{ currentOperand, operation, listOperand, listOperation, calculationResult }, dispatch] = useReducer(
    reducer,
    {currentOperand: 0, listOperand: [], listOperation: []}
  )

  const createCalculation = useCallback(async () => {	
	let input = evaluate(currentOperand, operation, listOperand, listOperation).split(" ")
	input = input.filter(n => n)

	const inputMapped = input.map((i) => {
		switch(i) {
			case "+":
				return "add"
			case "-":
				return "substract"
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
	const res = await fetch('https://asia-southeast2-serverless-calculator.cloudfunctions.net/serverless-calculator/calculation', requestOptions)

	const result = await res.json()

	dispatch({ type: ACTIONS.EVALUATE,  payload: { calculationResult: result.result } })

  }, [currentOperand, operation, listOperand, listOperation])

  return (
    <div className="calculator-grid">
      <div className="output">
        <div className="current-operand">{evaluate(currentOperand, operation, listOperand, listOperation, calculationResult)}</div>
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
	  <DigitButton digit="|x|" dispatch={dispatch} />
      <DigitButton digit="-x" dispatch={dispatch} />
      <DigitButton digit="x²" dispatch={dispatch} />
      <OperationButton operation="√x" dispatch={dispatch} />
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