# AI AGENT MANDATORY RULES

USER's name : TADEO

- 1. NO POLITINESS STUPIDITY
- 2. ALWAYS TELL THE BRUTAL TRUTH
- 3. NEVER CLAIM IT WORKS
- 4. NEVER Read the doc before the codebase
- 5. NO OVER VERBOSITY STRICT NECESSARY
- 6. DO NEVER OVERSTEP
- 7. DO NEVER STUB OR TODO
- 8. ALWAYS PROPER AND FULL IMPLEMENTATIONS
- 10. IF It'S TOO HARD => GO ONLINE RESEARCH; HOW THE MAJOR FRAMEWORKS MANAGES IT; HOW THEY SOLVES THE CURRENT ISSUES
- 11. ARCHITECTURE IS KEY ALWAYS USE DESIGN / ARCHITECTURE PATTERNS
- 12. Do not delegate sub agents without giving proper context
- 13. never underestimates remaining work to do !

---

TypeScript rules:

- Do never use ANY types
- Do never use stub types
- ALWAYS CREATE PROPER INTERFACE IF NOTHING ELSE EXISTS
- Do Nevers use `as const`
- ALWAYS use `satisfies Type` when it's necessary
- DO NEVER USE ES6 Classes
- ALWAYS USE Prototype based Classes

  the constructor is always defined in the interface

  interface IMyInterfaceClass {
  new(): IMyInterfaceClass
  }

  Always use Object.assign(MyClass.prototype, {.... here goes the functions })

- the prototype class structure is
  [featureClass]/[prototypes] <= all the functions one item per file !
  [featureClass]/[feature-class-name].ts <= the class
  [featureClass]/[feature-class-name].types.ts <= the interface
  [featureClass]/[feature-class-name].test.ts <= the test

Files structure:

- naming convention : kebab-case ALWAYS!
- Feature Slice Pattern ALWAYS
- one item per file ALWAYS
- interfaces always starts with I
- types always ends by Type
- enums always ends by Enum

work mode with your user:

- NO Useless politiness
- NO Optimistic claims ! ONLY THE TRUTH
- It works ! It not works ! BINARY CLEAR STATMENT !

- DO NOT OVER USE EMOJIS I REALLY DON'T GIVE A SHIT OF THIS !
- Accepted are CHECKMARK and RED CROSS (TRUE / FALSE)

Development structure:
ALWAYS UNDER => `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\implementation-plans\[feature]\...`

`[archive]\` <= all old files
`[analyse]\` <= all related analysis files
`[plan]\` <= all related plans files
`[results]\` <= all related results files
`[test]\` <= all related tests files

implementation-plans nomenclature: `[yyyy-MM-dd-HH:mm]-[feature]-[phase]-#`
analyse nomenclature: `[yyyy-MM-dd-HH:mm]-[feature]-[phase]-#`

WHEN YOU REACHES THE TOKEN LIMIT => DIRECTLY WRITE the next file and tell the user that's time to resume work in next session by pointing out the created followup file!
