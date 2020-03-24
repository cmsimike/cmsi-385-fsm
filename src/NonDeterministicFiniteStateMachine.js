import DeterministicFiniteStateMachine from './DeterministicFiniteStateMachine';

export const LAMBDA = '';

export default class NonDeterministicFiniteStateMachine extends DeterministicFiniteStateMachine {

  /**
   */
  constructor(description) {
    super(description);
  }


  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    if(!this.transitions[state]) return [];
    return this.transitions[state][symbol] || [];
  }

  accepts(string, state = this.startState) {
    let currentChar;
    let restString;
    let allowedTransitions;

    if(state === 'start') {
      currentChar = LAMBDA;
      restString = string;
      allowedTransitions = this.transition(state, currentChar);
    } else {
      currentChar = string[0];
      restString = string.substr(1);
      allowedTransitions = this.transition(state, currentChar);
    }

    if(string.length === 0) {
      // Are we at an accept state?
      let passed = this.stateAccepted(state);

      // or are we at a state tht can lambda move to an accept state?
      for(let i = 0; i < allowedTransitions.length; i++) {
        passed = passed || this.stateAccepted(allowedTransitions[i]);
      }
      return passed;
    }

    // console.warn({string: string, currentChar: currentChar, restString: restString, allowedTransitions:allowedTransitions});

    for(let i = 0; i < allowedTransitions.length; i++) {
      if(this.accepts(restString, allowedTransitions[i])) {
        return true;
      }
    }    

    return false;
  }
}

