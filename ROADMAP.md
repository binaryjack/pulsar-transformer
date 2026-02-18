# Pulsar Transformer Roadmap

**Current Version**: v1.0.0-alpha.6  
**Target Release**: v1.0.0 (Q2 2026)

---

## v1.0.0-alpha.7 (In Progress)

### Critical Fixes

- [ ] Function type annotations support
- [ ] PSR import path resolution
- [ ] Generic type parameters (pending lexer upgrade)
- [ ] Abstract class full support

### Code Quality

- [ ] Increase test coverage to 95%
- [ ] Fix remaining integration test failures
- [ ] Refactor emitter for cleaner output

---

## v1.0.0-beta.1 (Q2 2026)

### Feature Completion

- [ ] Full TypeScript compatibility
- [ ] All PSR syntax features
- [ ] Source map generation
- [ ] Error recovery improvements

### Performance

- [ ] Optimization pass
- [ ] Target: 250K+ tokens/sec
- [ ] Memory usage optimization
- [ ] Streaming parser option

---

## v1.0.0 (Q2 2026)

### Release Criteria

- ✅ 100% test pass rate
- ✅ >= 95% code coverage
- ✅ Full TypeScript parity
- ✅ Production-grade error messages
- ✅ Complete documentation
- ✅ Stable API

### Post-1.0 Plans

- Incremental compilation
- Watch mode optimizations
- WebAssembly port exploration
- LSP integration for IDEs

---

## Known Limitations

### Blocked by Lexer

- Generic type parameters (requires lexer state management)
- Complex type annotations in certain contexts

### Documentation Needed

- Architecture guide
- Parser extension guide
- Custom transform guide
- Performance tuning guide

---

## Community Feedback

Priority areas based on user feedback:

1. Better error messages with context
2. Faster compilation times
3. Source map accuracy
4. IDE integration improvements

---

Track issues: [GitHub Issues](https://github.com/binaryjack/pulsar-transformer/issues)
