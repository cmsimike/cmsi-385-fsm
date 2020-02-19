export default class DeterministicFiniteStateMachine {

  /**
   */
  constructor({ transitions, startState, acceptStates }) {
    this.transitions = transitions;
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  states() {
    return Object.keys(this.transitions);
  }

  stateAccepted(state) {
    return this.acceptStates.includes(state);
  }

  /**
   *
   * @returns a string state name
   */
  transition(state, symbol) {
    return this.transitions[state][symbol];
  }

  accepts(string, state = this.startState) {
    const nextState = this.transition(state, string.charAt(0));
    return (string.length === 0) ? this.stateAccepted(state) :
                                   this.accepts(string.substr(1), nextState);
  }

}

/**
*/
export function cross(dfa1, dfa2, acceptanceCriteria = (dfa1State, dfa2State) => true) {
  // final info
  let newTransitions = {};
  let startState = '';
  let acceptStates = [];

  // work variables
  let dfa1Transitions = dfa1['transitions'];
  let dfa2Transitions = dfa2['transitions'];

  let dfa1StateKeys = Object.keys(dfa1Transitions);
  let dfa2StateKeys = Object.keys(dfa2Transitions);

  let newStates = [];

  // Generate all new states
  for(let i = 0; i < dfa1StateKeys.length; i++) {
    for(let j = 0; j < dfa2StateKeys.length; j++) {
      let newStateName = dfa1StateKeys[i] + '-' + dfa2StateKeys[j];

      newStates.push(newStateName);
    }
  }

  // for each of the new states, let's figure out the new transitions
  for(let i = 0; i < newStates.length; i++) {
    // we know the new states are stored in <dfa1>-<dfa2> format, so 
    // we can just split on '-'
    let splitStates = newStates[i].split('-');

    let dfa1TransitionToStateOn0 = dfa1['transitions'][splitStates[0]]['0'];
    let dfa2TransitionToStateOn0 = dfa2['transitions'][splitStates[1]]['0'];

    let dfa1TransitionToStateOn1 = dfa1['transitions'][splitStates[0]]['1'];
    let dfa2TransitionToStateOn1 = dfa2['transitions'][splitStates[1]]['1'];

    newTransitions[newStates[i]] = {};
    newTransitions[newStates[i]]['0'] = dfa1TransitionToStateOn0 + '-' + dfa2TransitionToStateOn0;
    newTransitions[newStates[i]]['1'] = dfa1TransitionToStateOn1 + '-' + dfa2TransitionToStateOn1;
  }
  // figure out new start state
  startState = dfa1['startState'] + '-' + dfa2['startState'];

  // figure out new accept states
  for(let i = 0; i < newStates.length; i++) {
    // we know the new states are stored in <dfa1>-<dfa2> format, so 
    // we can just split on '-'
    let states = newStates[i].split('-');
    // console.log(states[0] + "|||||" + states[1]);
    if (acceptanceCriteria(states[0], states[1])) {
       acceptStates.push(newStates[i]);
    }
  }

  // build the object
  let dfaCross = {
      transitions: newTransitions,
      startState: startState,
      acceptStates: acceptStates,
    };

  return new DeterministicFiniteStateMachine (dfaCross);
}

export function union(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (dfa1State, dfa2State) => dfa1.stateAccepted(dfa1State) || dfa2.stateAccepted(dfa2State));
}

export function intersection(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (dfa1State, dfa2State) => dfa1.stateAccepted(dfa1State) && dfa2.stateAccepted(dfa2State));
}

export function minus(dfa1, dfa2) {
  return cross(dfa1, dfa2, 
    (dfa1State, dfa2State) => dfa1.stateAccepted(dfa1State) && !dfa2.stateAccepted(dfa2State));
}
