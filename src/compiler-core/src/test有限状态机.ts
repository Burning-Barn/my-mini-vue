// /abc/  有限状态机 finite state machine
export function finiteStateMachineTest(string) {
    let i
    let startIndex 
    let endIndex

    function waitForA(val) {
        if(val === 'a') {
            startIndex = i
            return waitForB
        } 
        return waitForA
    }

    function waitForB(val) {
        if(val === 'b') {
            return waitForC
        } 
        return waitForA
    }
    
    function waitForC(val) {
        if(val === 'c') {
            endIndex = i
            return 'end'
        } 
        return waitForA
    }


    let _currentState: any = waitForA
    for (i = 0; i < string.length; i++) {
        // const _index = string[i];
        _currentState = _currentState(string[i])

    }

            
    if(_currentState === 'end') {
        console.log(startIndex, endIndex)
        return true
    }
    return false
}

finiteStateMachineTest('1abc')