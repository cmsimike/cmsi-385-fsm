export default class DeterministicFiniteStateMachine {

    /**
     */
    constructor({transitions, startState, acceptStates}) {
        this.transitions = transitions;
        this.startState = startState;
        this.acceptStates = acceptStates;
    }

    alphabet() {
        const alphabet = new Set();

        for (const [state, desc] of Object.entries(this.transitions)) {
            for (const symbol of Object.keys(desc)) {
                alphabet.add(symbol);
            }
        }

        return alphabet.values();
    }

    states() {
        return new Set(Object.keys(this.transitions));
    }

    stateAccepted(state) {
        return this.acceptStates.includes(state);
    }

    /**
     *
     * @returns a string state name
     */
    transition(state, symbol) {
        if (!this.transitions[state]) return;
        return this.transitions[state][symbol];
    }

    accepts(string, state = this.startState) {
        const nextState = this.transition(state, string.charAt(0));
        return (string.length === 0) ? this.stateAccepted(state) :
            this.accepts(string.substr(1), nextState);
    }

}

/**
 *
 */
export function cross(dfa1, dfa2, accepts = (dfa1State, dfa2State) => true) {
    const acceptStates = [];
    const transitions = {};
    const alphabet = new Set([...dfa1.alphabet(), ...dfa2.alphabet()]);

    // A function which returns a state name for a state in machine 1 and a state in machine 2
    const stateName = (state1, state2) => `m1:${state1}xm2:${state2}`;

    const startState = stateName(dfa1.startState, dfa2.startState);
    const unresolvedStates = [{state: startState, state1: dfa1.startState, state2: dfa2.startState}];

    while (unresolvedStates.length > 0) {
        const {state1, state2, state} = unresolvedStates.pop();

        transitions[state] = {};
        if (accepts(state1, state2)) acceptStates.push(state);

        for (const symbol of alphabet) {
            const nextState1 = dfa1.transition(state1, symbol);
            const nextState2 = dfa2.transition(state2, symbol);

            const nextState = stateName(nextState1, nextState2);
            transitions[state][symbol] = nextState;

            if (!transitions[nextState]) {
                // recording that we need to process this state
                unresolvedStates.push({state: nextState, state1: nextState1, state2: nextState2});
            }
        }
    }

    return new DeterministicFiniteStateMachine({
        acceptStates,
        startState,
        transitions
    });
}

export function union(dfa1, dfa2) {
    return cross(dfa1, dfa2,
        (state1, state2) => dfa1.stateAccepted(state1) || dfa2.stateAccepted(state2));
}

export function intersection(dfa1, dfa2) {
    return cross(dfa1, dfa2,
        (state1, state2) => dfa1.stateAccepted(state1) && dfa2.stateAccepted(state2));
}

export function minus(dfa1, dfa2) {
    return cross(dfa1, dfa2,
        (state1, state2) => dfa1.stateAccepted(state1) && !dfa2.stateAccepted(state2));
}

export function minimize(dfa) {
    function constructGroupObj() {
        return {
            'acceptStates': [],
            'queryStates': [],
            'individualAcceptStates': [],
            'individualStates': []
        }
    }

    let stateNameGen = function (arr) {
        return arr.join('-');
    }
    let getNewStateName = function (oldStateName, newGroups) {
        if (groups['individualStates'].includes(oldStateName)) {
            return oldStateName;
        } else if (groups['queryStates'].includes(oldStateName)) {
            return stateNameGen(groups['queryStates']);
        } else if (groups['acceptStates'].includes(oldStateName)) {
            return stateNameGen(groups['acceptStates']);
        } else if (groups['individualAcceptStates'].includes(oldStateName)) {
            return oldStateName;
        }
    }
    // prepopulate the k=0 generation
    let groups = constructGroupObj();
    let states = dfa.states();


    states.forEach(function (state) {
        // console.warn("current state " + state);
        if (dfa.acceptStates.includes(state)) {
            // List of accept states
            groups['acceptStates'].push(state);
        } else {
            groups['queryStates'].push(state);
        }
    });

    // we grab a state from query state
    // we check transitions and make sure both transitions end up in the same "queryStates group"
    // If we do, we move onto the next queryState state and do the same thing
    // If not, we remove that state from constructGroupObj,
    // put it into individualStates and keep doing that until we don't remove from the queryStates

    let cont = false;
    do {
        cont = false;
        for (let i = 0; i < groups['queryStates'].length; i++) {
            let stateToCheck = groups['queryStates'][i];
            let stateTransitionsTo = [];
            let alphabet = [...dfa.alphabet()];

            for (let j = 0; j < alphabet.length; j++) {
                let out = dfa.transition(stateToCheck, alphabet[j]);
                stateTransitionsTo[j] = out;
            }

            for (let j = 0; j < stateTransitionsTo.length; j++) {
                if (!groups['queryStates'].includes(stateTransitionsTo[j])) {
                    groups['individualStates'].push(stateToCheck);
                    delete groups['queryStates'][i]; // sets the element to be undefined, we are still fine array length wise
                    cont = true;
                }
            }

        }
    } while (cont);

    // Same as above but do it with the accept states
    cont = false;
    do {
        cont = false;
        for (let i = 0; i < groups['acceptStates'].length; i++) {
            let stateToCheck = groups['acceptStates'][i];
            let stateTransitionsTo = [];
            let alphabet = [...dfa.alphabet()];

            for (let j = 0; j < alphabet.length; j++) {
                let out = dfa.transition(stateToCheck, alphabet[j]);
                stateTransitionsTo[j] = out;
            }

            for (let j = 0; j < stateTransitionsTo.length; j++) {
                if (!groups['acceptStates'].includes(stateTransitionsTo[j])) {
                    groups['individualAcceptStates'].push(stateToCheck);
                    delete groups['acceptStates'][i]; // sets the element to be undefined, we are still fine array length wise
                    cont = true;
                }
            }

        }
    } while (cont);

    groups['queryStates'] = groups['queryStates'].filter(function (element) {
        return element !== undefined;
    });
    groups['acceptStates'] = groups['acceptStates'].filter(function (element) {
        return element !== undefined;
    });
    
    // create the new dfa

    let defn = {};


    let newTransitions = {};
    states.forEach(function (state) {
        // let's figure out where this is transitioning
        let dfaTransitionToStateOn0 = dfa['transitions'][state]['0'];
        let dfaTransitionToStateOn1 = dfa['transitions'][state]['1'];

        let stateFrom = getNewStateName(state, groups);
        let stateTo0 = getNewStateName(dfaTransitionToStateOn0, groups);
        let stateTo1 = getNewStateName(dfaTransitionToStateOn1, groups);

        if (!newTransitions.hasOwnProperty(stateFrom)) {
            newTransitions[stateFrom] = {};
            newTransitions[stateFrom]['0'] = stateTo0;
            newTransitions[stateFrom]['1'] = stateTo1;
        }
    });

    let min = {
        transitions: newTransitions,
        startState: getNewStateName(dfa['startState'], groups),
        acceptStates: groups['individualAcceptStates'].concat([stateNameGen(groups['acceptStates'])]),
    };

    return new DeterministicFiniteStateMachine(min);
}