type Class = { new(...args: any[]): {}; };

const metadata = new Map();
const instances = new Map();

const Inject = (inject: Class) => {
  return (target: Class, propertyKey: string | Symbol, index: number) => {
    // create or fill metadata for class and his required constructor arguments
    const meta = metadata.get(target) ?? { args: [] }; 

    meta.args[index] = inject;
    metadata.set(target, meta);
  }
}

interface IContainerOptions {
  providers: Class[];
}

const Module = (options: IContainerOptions) => {
  return <T extends Class>(constructor: T) => {
    return class extends constructor {
      providers: {}[];

      constructor(...args: any[]) {
        super();
        this.providers = options.providers.map((provider) => {
          const meta = metadata.get(provider);
          let deps = [];
          if (meta != null) {
            deps = meta.args.map((cls: Class, index: number) => {
              const hasProvider = options.providers.some((item) => cls === item);

              if (!hasProvider) {
                throw new Error(`Module ${constructor.name} doesn't have provider ${cls.name} that is required in ${provider.name} provider at position ${index}`);
              }


              let instance = instances.get(cls);

              if (instance == null) {
                instance = new cls();
                instances.set(cls, instance);
              }

              return instance;
            });
          }

          return new provider(...deps);
        });
      }
    }
  };
}

class A {
  log() {
    console.log('A');
  }
}

class B {
  constructor(
    @Inject(A)
    private readonly a: A,
  ) {}

  getA() {
    return this.a;
  }
}

class C {
  constructor(
    @Inject(A)
    private readonly a: A,
    @Inject(B)
    private readonly b: B,
  ) {}

  getA() {
    return this.a;
  }
}

@Module({
  providers: [A, B, C],
})
class D {
  providers: Partial<[A, B, C]> = [];

  compare() {
    const [, b, c] = this.providers;
    if (b != null && c != null) {
      console.log(`singleton: ${b.getA() == c.getA()}`);
    }
  }
}

const d = new D();
d.compare();
