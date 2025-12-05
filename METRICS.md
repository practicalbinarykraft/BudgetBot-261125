# BudgetBot Quality Metrics

> **Baseline:** 2025-12-04 | **Updated:** 2025-12-05
> **Target:** Acquisition-ready (Bank of America / Tinkoff / Alfa-Bank)

## 📊 Current Status Dashboard

| Metric | Baseline | Current | Target | Status |
|--------|----------|---------|--------|--------|
| Backend tests | 116 | **194** | >500 | 🟡 |
| Frontend tests | 0 | **21** | >100 | 🟡 |
| Test coverage | ~5% | ~15% | >80% | 🔴 |
| TypeScript `any` (server) | 282 | **27** | <10 | 🟡 |
| TypeScript `any` (client) | — | **21** | <10 | 🟡 |
| Files >200 lines | 73 | **75** | 0 | 🔴 |
| TODO/FIXME in code | — | **8** | 0 | 🟡 |
| ARIA attributes | 5 | **5** | >100 | 🔴 |
| Responsive classes | — | **74** | >300 | 🔴 |
| Sidebar menu items | 14 | **5** | 5 | 🟢 |
| Build time | — | **8.8s** | <10s | 🟢 |
| TSC errors | — | **0** | 0 | 🟢 |

### Legend
- 🟢 On target
- 🟡 Needs improvement
- 🔴 Critical

---

## 🎯 Roadmap Progress

### PHASE 0: Tech Debt Freeze ✅
- [x] Sprint 0.1: Audit & Baseline
- [x] Sprint 0.2: Test Infrastructure

### PHASE 1: Foundation (Tests) ✅
- [x] Sprint 1.1: Auth tests (9 tests)
- [x] Sprint 1.2: Transaction tests (12 tests)
- [x] Sprint 1.3: Wallet & Stats tests (7 tests)
- [x] Sprint 1.4: Frontend tests (21 tests) ✅

### PHASE 2: Type Safety 🟡 (почти готова)
- [x] Sprint 2.1: Create type definitions (done)
- [x] Sprint 2.2: Type auth & middleware (2 any осталось)
- [x] Sprint 2.3: Type repositories (done)
- [x] Sprint 2.4: Type routes & services (27 any, в основном catch blocks)

### PHASE 3: UX Revolution
- [x] Sprint 3.1: Information Architecture (14→5 menu) ✅
- [x] Sprint 3.2: Onboarding Flow ✅
- [ ] Sprint 3.3: Quick Add Transaction
- [ ] Sprint 3.4: Dashboard Redesign

### PHASE 4: Accessibility
- [ ] Sprint 4.1: Semantic HTML & ARIA
- [ ] Sprint 4.2: Color Contrast & Focus

### PHASE 5: Mobile-First
- [ ] Sprint 5.1: Responsive Audit & Fix
- [x] Sprint 5.2: PWA Setup ✅
- [ ] Sprint 5.3: Offline Capability

### PHASE 6: Security Hardening
- [x] Sprint 6.1: Security Headers
- [x] Sprint 6.2: Two-Factor Authentication ✅
- [ ] Sprint 6.3: Session Security

### PHASE 7: AI Enhancement
- [ ] Sprint 7.1: Improve Categorization
- [ ] Sprint 7.2: Spending Insights
- [ ] Sprint 7.3: Natural Language Input

### PHASE 8: Integrations
- [ ] Sprint 8.1: Bank Integration Research
- [ ] Sprint 8.2: Import Transactions

### PHASE 9: Polish & Launch
- [x] Sprint 9.1: Performance (partial)
- [x] Sprint 9.2: Documentation (Swagger)
- [x] Sprint 9.3: Monitoring & Alerts

---

## 📁 Files Requiring Refactoring (>200 lines)

### Critical (>400 lines)
| File | Lines | Action |
|------|-------|--------|
| shared/schema.ts | 817 | Split into domain schemas |
| landing-page.tsx | 475 | Extract sections |
| advanced-analytics-page.tsx | 464 | Extract components |
| trend-calculator.service.ts | 448 | Split calculation logic |
| asset-detail.tsx | 440 | Extract sub-components |
| financial-trend-chart.tsx | 429 | Extract chart helpers |

### High Priority (300-400 lines)
| File | Lines | Action |
|------|-------|--------|
| product-detail-page.tsx | 388 | Extract sections |
| transactions.routes.ts | 377 | Split into sub-routers |
| advanced-analytics.service.ts | 340 | Split analytics logic |
| migration.service.ts | 327 | Could split if grows |

---

## 🔧 How to Run Metrics

```bash
# Full metrics report
npm run metrics

# Individual checks
npm run metrics:any      # Count any types
npm run metrics:lines    # Count file sizes
npm run metrics:tests    # Count test files
```

---

## 📈 History

| Date | Tests | any | Files>200 | Notes |
|------|-------|-----|-----------|-------|
| 2025-12-04 | 116 | 282 | 73 | Initial baseline |
| 2025-12-05 | 215 | 48 | 75 | +21 frontend tests, total 215 |

---

## ✅ Quality Gates (PR Checklist)

Before merging any PR:
- [ ] No new `any` added (or justified in comment)
- [ ] New code has >80% test coverage
- [ ] No new files >200 lines
- [ ] All existing tests pass
- [ ] Accessibility checked (if UI change)

---

## 🏆 Definition of Done: Acquisition-Ready

- [ ] SOC 2 Type II compliant
- [ ] WCAG 2.1 AA certified
- [ ] GDPR/CCPA compliant
- [ ] 99.9% uptime (3 months)
- [ ] >10,000 MAU, >40% retention
- [ ] Test coverage >80%
- [ ] Mobile app in stores
- [ ] Bank integrations working
- [ ] Documentation complete
- [ ] No critical bugs (30 days)
