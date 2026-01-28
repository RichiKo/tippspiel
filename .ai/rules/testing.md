# Testing Guidelines

Best Practices und Konventionen für Tests im Tipp-Spiel Projekt.

---

## Allgemeine Prinzipien

- **Test-Pyramide:** Mehr Unit-Tests, weniger Integration-Tests, noch weniger E2E-Tests
- **Arrange-Act-Assert (AAA):** Klare Struktur in jedem Test
- **Isolierte Tests:** Tests dürfen sich nicht gegenseitig beeinflussen
- **Aussagekräftige Namen:** Test-Namen beschreiben das erwartete Verhalten
- **Kein Test-Code in Produktion:** Test-Utilities nur in Test-Dateien

---

## Frontend (Angular)

### Test-Stack

- **Unit Tests:** Jasmine + Karma
- **E2E Tests:** Cypress oder Playwright (empfohlen)
- **Code Coverage:** Istanbul (integriert in Angular CLI)

### Unit Tests

#### Komponenten-Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent, // Standalone component
        HttpClientTestingModule,
        ReactiveFormsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have invalid form when email is invalid', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: '123456'
    });
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have valid form when inputs are correct', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: '123456'
    });
    expect(component.loginForm.valid).toBeTruthy();
  });
});
```

#### Service-Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Sicherstellen, dass keine offenen Requests existieren
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch current user', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    service.getCurrentUser().subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('/api/user');
    expect(req.request.method).toBe('GET');
    req.flush({ user: mockUser });
  });

  it('should handle error when fetching user fails', () => {
    service.getCurrentUser().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/user');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
```

#### Signal-Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';

describe('Signal State Management', () => {
  it('should update computed signal when source signal changes', () => {
    const count = signal(0);
    const doubled = computed(() => count() * 2);

    expect(doubled()).toBe(0);

    count.set(5);
    expect(doubled()).toBe(10);
  });

  it('should handle linkedSignal correctly', () => {
    const input = signal('initial');
    const writable = linkedSignal(() => input());

    expect(writable()).toBe('initial');

    // Input ändert sich
    input.set('updated');
    expect(writable()).toBe('updated');

    // Lokal ändern
    writable.set('local');
    expect(writable()).toBe('local');
    expect(input()).toBe('updated'); // Input bleibt unverändert
  });
});
```

### E2E Tests

Hinweis: E2E-Tests nur nutzen, wenn Cypress/Playwright im Projekt eingerichtet sind.
Sonst Abschnitt als optional betrachten.

```typescript
// cypress/e2e/login.cy.ts
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login form', () => {
    cy.get('form').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show validation errors for invalid input', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/auth/login');
  });
});
```

### Test-Regeln (Frontend)

- **Mindest-Coverage (Richtwert):** 70% fuer Services, 50% fuer Components
- **Mocking:** Immer `HttpClientTestingModule` für API-Calls nutzen
- **Keine echten API-Calls:** Tests müssen offline laufen
- **Fixture.detectChanges():** Nach jeder Änderung aufrufen
- **TestBed Cleanup:** `afterEach(() => TestBed.resetTestingModule())`

---

## Backend (NestJS)

### Test-Stack

- **Unit Tests:** Jest
- **E2E Tests:** Supertest + Jest
- **Code Coverage:** Jest Coverage Reporter

### Unit Tests

#### Service-Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and save a new user', async () => {
      const createDto = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'hashedpassword',
      };
      const savedUser = { id: 1, ...createDto };

      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(createDto);

      expect(result).toEqual(savedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createDto);
    });
  });
});
```

#### Controller-Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    generateJwt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return user with token on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: '123456' };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };
      const mockToken = 'jwt-token';

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.generateJwt.mockResolvedValue(mockToken);

      const result = await controller.login({ user: loginDto });

      expect(result).toEqual({
        user: { ...mockUser, token: mockToken },
      });
    });
  });
});
```

### E2E Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send({
          user: {
            username: 'testuser',
            email: 'test@example.com',
            password: '123456',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('token');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 422 for duplicate email', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send({
          user: {
            username: 'testuser2',
            email: 'test@example.com', // Bereits existiert
            password: '123456',
          },
        })
        .expect(422);
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send({
          user: {
            username: 'testuser',
            email: 'invalid-email',
            password: '123456',
          },
        })
        .expect(400);
    });
  });

  describe('/users/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: '123456',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('token');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
        })
        .expect(401);
    });
  });

  describe('/user (GET)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: '123456',
          },
        });
      token = res.body.user.token;
    });

    it('should return current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/user')
        .expect(401);
    });
  });
});
```

### Test-Regeln (Backend)

- **Mindest-Coverage:** 80% für Services, 70% für Controller
- **Repository-Mocking:** Immer TypeORM Repositories mocken
- **Keine echten DB-Calls in Unit-Tests:** Nur in E2E-Tests
- **Test-DB:** E2E-Tests mit separater Test-Datenbank (SQLite oder In-Memory)
- **Cleanup:** Nach jedem E2E-Test DB zurücksetzen

---

## Mocking-Patterns

### HTTP-Mocking (Frontend)

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// In beforeEach:
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule]
});
httpMock = TestBed.inject(HttpTestingController);

// Im Test:
service.getData().subscribe();
const req = httpMock.expectOne('/api/data');
req.flush({ data: 'mock' });

// In afterEach:
httpMock.verify();
```

### Repository-Mocking (Backend)

```typescript
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

// In TestingModule:
{
  provide: getRepositoryToken(UserEntity),
  useValue: mockRepository,
}
```

### Zeit-Mocking

```typescript
// Datum/Zeit mocken
jest.useFakeTimers();
jest.setSystemTime(new Date('2026-01-25'));

// Nach Test:
jest.useRealTimers();
```

---

## Test-Befehle

### Frontend

```bash
# Unit-Tests ausführen
npm run test

# Unit-Tests mit Coverage
npm run test:coverage

# E2E-Tests (Cypress)
npm run e2e

# E2E-Tests (Headless)
npm run e2e:headless
```

### Backend

```bash
# Unit-Tests ausführen
npm run test

# Unit-Tests mit Coverage
npm run test:cov

# E2E-Tests
npm run test:e2e

# Watch-Modus
npm run test:watch
```

---

## Coverage-Ziele

| Bereich              | Ziel   | Minimum |
|----------------------|--------|---------|
| Backend Services     | 90%    | 80%     |
| Backend Controller   | 80%    | 70%     |
| Frontend Services    | 80%    | 70%     |
| Frontend Components  | 60%    | 50%     |

---

## Best Practices

### ✅ Do's

- Test-Namen beschreiben das Verhalten: `should return user when found`
- Arrange-Act-Assert Pattern konsistent nutzen
- Mocks nach jedem Test clearen
- Test-Daten klar und minimal halten
- Edge-Cases testen (null, undefined, leere Arrays)
- Error-Handling testen

### ❌ Don'ts

- Keine Test-Logik in Produktion-Code
- Keine `console.log()` in Tests (außer Debug)
- Keine externen Abhängigkeiten (echte API, DB)
- Keine Tests mit Zeit-/Random-Abhängigkeiten ohne Mocking
- Keine Tests, die von Reihenfolge abhängen

---

## CI/CD Integration

Tests laufen automatisch bei:

- **Pre-Commit:** Lint + Unit-Tests für geänderte Dateien
- **Pull Request:** Alle Unit-Tests + E2E-Tests
- **Main-Branch:** Vollständige Test-Suite + Coverage-Report
