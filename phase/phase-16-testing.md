# 📋 PHASE 16: Testing Strategy & Implementation

> **Duration:** 3-4 days  
> **Dependencies:** Phase 10, Phase 15

---

## 🎯 Phase Objectives

Implement comprehensive testing across backend, solver, and frontend.

---

## 📑 Task Breakdown

---

### 16.1-16.4 Unit Testing Setup

**Backend (Jest):**
```bash
npm install -D jest supertest @types/jest
```

```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterEnv: ['./tests/setup.js']
};

// tests/setup.js
const mongoose = require('mongoose');
beforeAll(async () => { await mongoose.connect(process.env.TEST_MONGODB_URI); });
afterAll(async () => { await mongoose.connection.close(); });
```

```javascript
// tests/unit/facultyController.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Faculty API', () => {
  let authToken;
  
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Test@123' });
    authToken = res.body.data.accessToken;
  });
  
  describe('GET /api/v1/faculties', () => {
    it('should return paginated faculties', async () => {
      const res = await request(app).get('/api/v1/faculties').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
    
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/faculties');
      expect(res.status).toBe(401);
    });
  });
});
```

**Solver (pytest):**
```python
# solver/tests/test_solver.py
import pytest
from app.solver.engine import TimetableSolver
from app.models.request import SolverRequest, FacultyInput, RoomInput, SubjectInput, BatchInput

@pytest.fixture
def simple_request():
    return SolverRequest(
        faculties=[FacultyInput(id="f1", name="Dr. Smith", department_id="d1", subject_ids=["s1"])],
        rooms=[RoomInput(id="r1", code="R101", capacity=60)],
        subjects=[SubjectInput(id="s1", code="CS101", name="Test", department_id="d1")],
        batches=[BatchInput(id="b1", code="CSE-1A", department_id="d1", semester=1, size=50, subjects=[{"subject_id": "s1", "classes_per_week": 3}])],
        slots_per_day=4
    )

def test_solver_finds_solution(simple_request):
    solver = TimetableSolver(simple_request)
    result = solver.solve()
    assert result.status in ["optimal", "feasible"]
    assert len(result.solutions) > 0

def test_no_batch_overlap(simple_request):
    solver = TimetableSolver(simple_request)
    result = solver.solve()
    events = result.solutions[0].events
    times = [(e.day, e.slot) for e in events]
    assert len(times) == len(set(times)), "Batch has overlapping classes"
```

**Frontend (Vitest):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```javascript
// frontend/vitest.config.js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', globals: true, setupFiles: './tests/setup.js' }
});

// frontend/tests/components/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/components/common/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

### 16.5-16.8 Integration & E2E Tests

```bash
npm install -D playwright @playwright/test
npx playwright install
```

```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@college.edu');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });
});

test.describe('Timetable Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@college.edu');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
  });
  
  test('should generate timetable', async ({ page }) => {
    await page.goto('/solver');
    await page.selectOption('select[name="department"]', { index: 1 });
    await page.click('button:has-text("Generate")');
    await expect(page.locator('text=RUNNING')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 120000 });
  });
});
```

---

### 16.9-16.12 Solver Validation & Load Testing

```python
# solver/tests/test_validation.py
def test_no_hard_violations(simple_request):
    solver = TimetableSolver(simple_request)
    result = solver.solve()
    for solution in result.solutions:
        assert solution.violations["hard"] == 0, "Hard constraint violated"

def test_all_classes_scheduled(simple_request):
    solver = TimetableSolver(simple_request)
    result = solver.solve()
    total_required = sum(bs.classes_per_week for b in simple_request.batches for bs in b.subjects)
    assert len(result.solutions[0].events) == total_required
```

```bash
# Load testing with k6
npm install -g k6

# k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  const res = http.get('http://localhost:5000/api/v1/faculties');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## ✅ Phase 16 Completion Checklist

```
□ Jest configured for backend
□ Backend unit tests written
□ pytest configured for solver
□ Solver constraint tests
□ Vitest configured for frontend
□ Component tests written
□ Playwright E2E tests
□ Login flow tested
□ Timetable generation tested
□ Solver validation suite
□ Load testing setup
□ CI test scripts ready
```

---

## ⏭️ Next: Phase 17 - Deployment
