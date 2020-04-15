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

  possibleNextStates(state, symbol) {
    const nextStates = new Set();

    for(const startState of this.reachableFromLambda(state)) {
      for(const nextState of this.transition(startState, symbol)) {
        nextStates.add(nextState);
      }  
    }

    return nextStates;
  }

  reachableFromLambda(state, reachable = {}) {
    if(reachable[state]) return;
    reachable[state] = true;

    for(const nextState of this.transition(state, LAMBDA)) {
      this.reachableFromLambda(nextState, reachable);
    }

    return Object.keys(reachable);
  }

  accepts(string, state = this.startState) {
    if(string.length === 0 && this.stateAccepted(state)) return true;

    const symbol = string.charAt(0);

    for(const nextState of this.possibleNextStates(state, symbol)) {
      if(this.accepts(string.substr(1), nextState)) return true;
    }

    return false;
  }

  combinedStateName(states) {
    if (states.size > 0) {
      let arr = Array.from(states);
      arr.sort();
      return arr.join('-');
    } else {
      return states[0];
    }
  }

  toDfa () {

    let stateTable = [0,1];
    stateTable[0] = [];
    stateTable[1] = [];

    // start with the start state
    let statesToCheck = [this.startState];

    let allStatesSeen = new Set();

    while(statesToCheck.length > 0) {
      let theState = statesToCheck.shift();

      let combinedNextState;

      if (theState.includes('-')) {
        let split = theState.split('-');
        let innerStates = new Set();
        for(let i = 0; i < split.length; i++) {
          innerStates = new Set([...innerStates, ...this.possibleNextStates(split[i], 0)]);
        }
        combinedNextState = combinedStateName(innerStates);
      } else {
        combinedNextState = combinedStateName(this.possibleNextStates(theState, 0));
      }

      stateTable[0][theState] = combinedNextState;
      if(!allStatesSeen.includes(combinedNextState)) {
        statesToCheck.append(combinedNextState);
        allStatesSeen.append(combinedNextState);
      }

      if (theState.includes('-')) {
        let split = theState.split('-');
        let innerStates = new Set();
        for(let i = 0; i < split.length; i++) {
          innerStates = new Set([...innerStates, ...this.possibleNextStates(split[i], 1)]);
        }
        combinedNextState = combinedStateName(innerStates);
      } else {
        combinedNextState = combinedStateName(this.possibleNextStates(theState, 1));
      }

      combinedNextState = combinedStateName(this.possibleNextStates(theState, 1));
      stateTable[1][theState] = combinedNextState;
      if(!allStatesSeen.includes(combinedNextState)) {
        statesToCheck.append(combinedNextState);
        allStatesSeen.append(combinedNextState);
      }

    }

    let newTransitions = {};

    for(let key in stateTable[0]) {
      let val = stateTable[0][key];
      if (newTransitions[key] === undefined) {
        newTransitions[key] = {};
      }
      newTransitions[key][0] = val;
    }

    for(let key in stateTable[1]) {
      let val = stateTable[1][key];
      if (newTransitions[key] === undefined) {
        newTransitions[key] = {};
      }
      newTransitions[key][1] = val;
    }


    let startStateCombiner = new Set();
    startStateCombiner.add(this.startState);

    for(const nextState of this.transition(state, LAMBDA)) {
      startStateCombiner.add(nextState);
    }
    let startState = combinedStateName(startStateCombiner);

    let acceptStates = [];
    for(let as in this.acceptStates) {
      for(let key in stateTable[0]) {
        if (key.includes(as)) {
          acceptStates.push(as);
        }
      }
    }

    let newDfa = {
        transitions: newTransitions,
        startState: startState,
        acceptStates: acceptStates,
    };

    return newDfa;
  }
}

