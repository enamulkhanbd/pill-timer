# 🤝 Contributing to Pill Timer

First off, thank you for considering contributing to Pill Timer! It's people like you that make Pill Timer such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Process](#development-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Git
- Basic knowledge of React and TypeScript

### Setup Development Environment

1. **Fork the repository**
   - Visit https://github.com/enamulkhanbd/pill-timer
   - Click "Fork" button in the top right

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pill-timer.git
   cd pill-timer
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/enamulkhanbd/pill-timer.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Visit http://localhost:3000

---

## 💡 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Device: [e.g. iPhone 12, Desktop]
- OS: [e.g. iOS 15, Windows 11]
- Browser: [e.g. Chrome 96, Safari 15]
- Version: [e.g. 1.0.0]
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

**Feature Request Template:**
```markdown
**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other solutions did you consider?

**Additional Context**
Any other context or screenshots.
```

### Code Contributions

1. **Find an issue to work on**
   - Look for "good first issue" or "help wanted" labels
   - Comment on the issue to claim it

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the style guidelines
   - Add comments where necessary

4. **Test your changes**
   - Test on multiple devices
   - Test all affected features
   - Ensure no console errors

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill in the PR template

---

## 🔄 Development Process

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/code-improvement` - Code refactoring
- `test/test-addition` - Adding tests

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] No console warnings/errors
- [ ] Tested on mobile and desktop
- [ ] localStorage persistence works
- [ ] No breaking changes (or documented)

---

## 🎨 Style Guidelines

### TypeScript/React

```typescript
// ✅ Good
interface Medication {
  id: string;
  name: string;
  time: string;
}

const MedicationCard: React.FC<{ medication: Medication }> = ({ medication }) => {
  return (
    <div className="p-4 rounded-xl">
      <h3>{medication.name}</h3>
    </div>
  );
};

// ❌ Bad
const card = (med) => {
  return <div><h3>{med.name}</h3></div>
};
```

### Tailwind CSS

```tsx
// ✅ Good - Organized classes
<div className="flex items-center gap-4 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">

// ❌ Bad - Disorganized
<div className="bg-white gap-4 rounded-xl shadow-sm items-center flex p-6 transition-shadow hover:shadow-md">
```

### File Structure

```
components/
├── ui/              # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
└── features/        # Feature-specific components
    └── MedicationList.tsx
```

---

## 📝 Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```bash
feat(medications): add duration tracking feature

Add ability to track medication duration in days or date ranges.
Includes bidirectional conversion and progress visualization.

Closes #42

---

fix(storage): resolve daily reset timing issue

Fixed bug where medications weren't resetting at midnight.
Changed comparison from time to date string.

Fixes #38

---

docs(readme): update installation instructions

Added troubleshooting section and deployment guide.
```

---

## 🔀 Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested on different browsers
- [ ] No console errors

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No breaking changes
```

### Review Process

1. Maintainer reviews your PR
2. Feedback is provided (if needed)
3. Make requested changes
4. PR is approved and merged

### After Your PR is Merged

1. Delete your feature branch
2. Pull latest changes from main
3. Celebrate! 🎉

---

## 🐛 Debugging Tips

### Common Issues

**Issue: localStorage not persisting**
```typescript
// Check browser settings
console.log(localStorage.getItem('pillpal-data'));
```

**Issue: PWA not installing**
```typescript
// Check Service Worker registration
navigator.serviceWorker.getRegistrations().then(console.log);
```

**Issue: Styles not applying**
```bash
# Clear cache and rebuild
npm run build
```

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

## 🙏 Thank You!

Your contributions help make Pill Timer better for everyone. We appreciate your time and effort!

If you have questions, feel free to:
- Open an issue
- Start a discussion
- Reach out to maintainers

**Happy coding!** 💊✨
