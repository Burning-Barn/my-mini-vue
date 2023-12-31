import {effect, stop} from '../effect'
import {reactive} from '../reactive'

describe('effect', () => {
    it('happy path', () => {
        const user = reactive({
            age: 10,
        })

        let nextAge
        effect(() => {
            nextAge = user.age + 1
        })

        expect(nextAge).toBe(11)

        // update
        user.age+=1
        expect(nextAge).toBe(12)
    })

    it('should return runner when call effect', () => {
        let foo = 10
        const _runner = effect(() => {
            foo+=1
            return 'foo'
        })
        expect(foo).toBe(11)
        const _res = _runner()
        expect(foo).toBe(12)
        expect(_res).toBe('foo')
    })

    it("scheduler", () => {
        let dummy;
        let run: any;
        const scheduler = jest.fn(() => {
          run = runner;
        });
        const obj = reactive({ foo: 1 });
        const runner = effect(
          () => {
            dummy = obj.foo;
          },
          { scheduler }
        );
        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);
        // should be called on first trigger
        obj.foo++;
        expect(scheduler).toHaveBeenCalledTimes(1);
        // // should not run yet
        expect(dummy).toBe(1);
        // // manually run
        run();
        // // should have run
        expect(dummy).toBe(2);
      });

    it("stop", () => {
      let dummy;
      const obj = reactive({ prop: 1 });
      const runner = effect(() => {
        dummy = obj.prop;
      });
      obj.prop = 2;
      expect(dummy).toBe(2);
      stop(runner);
      // obj.prop = 3;
      // 当使用obj.prop++ 会出发obj.prop的get,又会收集依赖，但是stop之后不应该再次收集依赖，如果收集就会在SET时候出发依赖，也就是只有在effect中的Fn执行时，才要收集依赖，
      obj.prop++;
      expect(dummy).toBe(2);
  
      // stopped effect should still be manually callable
      runner();
      expect(dummy).toBe(3);
    });
    
    it("onStop", () => {
      const obj = reactive({
        foo: 1,
      });
      const onStop = jest.fn();
      let dummy;
      const runner = effect(
        () => {
          dummy = obj.foo;
        },
        {
          onStop,
        }
      );
  
      stop(runner);
      expect(onStop).toBeCalledTimes(1);
    });
})
