'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const expect = chai.expect
const Ioc = require('adonis-fold').Ioc
const Event = require('../../src/Event')

const Config = {
  get: function () {
    return {
      wildcard: true
    }
  }
}

describe('Event', function() {

  it('should be able to register an event', function (done) {
    const event = new Event(Config)
    event.on('foo', function (data) {
      expect(data).deep.equal({foo: 'bar'})
      done()
    })
    event.fire('foo', {foo: 'bar'})
  })

  it('should be able to pass multiple arguments to the emit method', function (done) {
    const event = new Event(Config)
    event.on('foo', function (data, bar) {
      expect(data).deep.equal({foo: 'bar'})
      expect(bar).deep.equal({bar: 'baz'})
      done()
    })
    event.emit('foo', {foo: 'bar'}, {bar: 'baz'})
  })

  it('should be able to pass multiple arguments to the fire method', function (done) {
    const event = new Event(Config)
    event.on('foo', function (data, bar) {
      expect(data).deep.equal({foo: 'bar'})
      expect(bar).deep.equal({bar: 'baz'})
      done()
    })
    event.fire('foo', {foo: 'bar'}, {bar: 'baz'})
  })

  it('should be able to bind a class instance to the callback', function (done) {
    const event = new Event(Config)
    class Foo {
      constructor () {
        this.name = 'foo'
      }
      sayFoo () {
        expect(this.name).to.equal('foo')
        done()
      }
    }
    const fooInstance = new Foo()
    event.on('foo', fooInstance.sayFoo.bind(fooInstance))
    event.fire('foo')
  })

  it('should be able to register generator method as callback', function (done) {
    const event = new Event(Config)
    const getName = function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve('foo')
        })
      })
    }
    event.on('foo', function * () {
      const name = yield getName()
      expect(name).to.equal('foo')
      done()
    })
    event.fire('foo')
  })

  it('should be able to make class instance from Ioc Container', function (done) {
    const event = new Event(Config)
    class Foo {

      constructor () {
        this.name = 'foo'
      }

      sayFoo () {
        expect(this.name).to.equal('foo')
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new Foo()
    })

    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo')
  })

  it('should be able to bind generator method', function (done) {
    const event = new Event(Config)
    class Foo {
      constructor () {
        this.name = null
      }

      * setName () {
        this.name = 'foo'
      }

      * sayFoo () {
        yield this.setName()
        expect(this.name).to.equal('foo')
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new Foo()
    })

    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo')
  })

  it('should be able to get data passed by the fire method', function (done) {
    const event = new Event(Config)
    class Foo {
      sayFoo (data) {
        expect(data).deep.equal({foo: 'bar'})
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new Foo()
    })

    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo', {foo: 'bar'})
  })

  it('should be able to get data passed by the fire method inside a generator method', function (done) {
    const event = new Event(Config)
    class Foo {
      * sayFoo (data) {
        expect(data).deep.equal({foo: 'bar'})
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new Foo()
    })

    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo', {foo: 'bar'})
  })

  it('should be able to listen for a event using the when method', function (done) {
    const event = new Event(Config)
    event.when('user.login', function (data) {
      expect(data).deep.equal({username: 'doe'})
      done()
    })
    event.fire('user.login', {username: 'doe'})
  })

  it('should be able to listen for a event using the listen method', function (done) {
    const event = new Event(Config)
    event.listen('user.login', function (data) {
      expect(data).deep.equal({username: 'doe'})
      done()
    })
    event.fire('user.login', {username: 'doe'})
  })

  it('should be able to listen for any event', function (done) {
    const event = new Event(Config)
    event.any(function (event, data) {
      expect(event).to.equal('foo')
      expect(data).to.equal('bar')
      done()
    })
    event.fire('foo', 'bar')
  })

  it('should be able to register one time only event listener', function (done) {
    let count = 0
    const event = new Event(Config)
    event.once('foo',function () {
      count++
    })
    event.fire('foo')
    event.fire('foo')
    expect(count).to.equal(1)
    done()
  })

  it('should be able to get list of listeners for a specific event', function () {
    const event = new Event(Config)
    event.once('foo',function () {
    })
    const listeners = event.getListeners('foo')
    expect(listeners).to.be.an('array')
    expect(listeners.length).to.equal(1)
  })

  it('should be able to get list of listeners for wildcard events', function () {
    const event = new Event(Config)
    event.once('foo.bar',function () {
    })
    const listeners = event.getListeners('foo.*')
    expect(listeners).to.be.an('array')
    expect(listeners.length).to.equal(1)
  })

  it('should tell whether there are any listeners for a given event', function () {
    const event = new Event(Config)
    event.once('foo.bar',function () {
    })
    expect(event.hasListeners('foo.*')).to.equal(true)
  })

  it('should tell whether wildcard is enabled or not', function () {
    const event = new Event(Config)
    expect(event.wildcard()).to.equal(true)
  })

  it('should be able to define named events', function (done) {
    const event = new Event(Config)
    event.on('foo', 'fooEvent', function () {
      done()
    })
    event.fire('foo')
  })

  it('should be able to remove named events', function () {
    const event = new Event(Config)
    event.on('foo', 'fooEvent', function () {
    })
    event.on('foo', 'anotherEvent', function () {
    })
    event.removeListener('foo', 'fooEvent')
    const listeners = event.getListeners('foo')
    expect(listeners.length).to.equal(1)
  })

  it('should be able to remove the correct named events', function (done) {
    const event = new Event(Config)
    event.on('foo', 'fooEvent', function () {
      expect(true).to.equal(false)
    })
    event.on('foo', 'anotherEvent', function () {
      expect(true).to.equal(true)
      done()
    })
    event.removeListener('foo', 'fooEvent')
    event.fire('foo')
  })

  it('should be able to remove all listeners for a given event', function () {
    const event = new Event(Config)
    event.on('foo', function () {
    })
    event.on('foo', function () {
    })
    event.removeListeners('foo')
    const listeners = event.getListeners('foo')
    expect(listeners.length).to.equal(0)
  })

  it('should be able to remove all listeners for all events', function () {
    const event = new Event(Config)
    event.on('foo', function () {
    })
    event.on('bar', function () {
    })
    event.removeListeners()
    expect(event.getListeners('foo').length).to.equal(0)
    expect(event.getListeners('bar').length).to.equal(0)
  })

  it('should be able to define the number for times a event should be executed', function () {
    const event = new Event(Config)
    let count = 0
    event.limit(4).on('foo', function () {
      count++
    })
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    expect(count).to.equal(4)
  })

  it('should have access to the actual event via the emitter property on context', function (done) {
    const event = new Event(Config)
    event.on('foo', function () {
      expect(this.emitter.event).to.equal('foo')
      done()
    })
    event.fire('foo')
  })

  it('should have access to the actual event via the emitter property on context when a generator method is binded', function (done) {
    const event = new Event(Config)
    const getName = function () {
      return new Promise((resolve) => resolve('done'))
    }
    event.on('foo', function * () {
      yield getName()
      expect(this.emitter.event).to.equal('foo')
      done()
    })
    event.fire('foo')
  })

  it('should have access to the actual event resolving out of the IoC container', function (done) {
    const event = new Event(Config)
    class FooListener {
      sayFoo () {
        expect(this.constructor.name).to.equal('FooListener')
        expect(this.emitter.event).to.equal('foo')
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new FooListener()
    })
    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo')
  })

  it('should have access to the actual event resolving out of the IoC container within a generator method', function (done) {
    const event = new Event(Config)
    class FooListener {
      * sayFoo () {
        expect(this.constructor.name).to.equal('FooListener')
        expect(this.emitter.event).to.equal('foo')
        done()
      }
    }
    Ioc.bind('App/Listeners/Foo', function () {
      return new FooListener()
    })
    event.on('foo', 'App/Listeners/Foo.sayFoo')
    event.fire('foo')
  })

})
