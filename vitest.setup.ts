// Vitest setup file
// Load environment variables for testing
import { config } from 'dotenv';
import { expect } from 'vitest';

config({ path: '.env.local' });

// Custom matchers replacement for DOM assertions (avoiding external dependency)
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `expected element to ${pass ? 'not ' : ''}be in the document`,
    };
  },
  
  toHaveClass(received, ...expectedClasses) {
    if (!received || typeof received.className !== 'string') {
      return {
        pass: false,
        message: () => `expected received to be a DOM element with className`,
      };
    }
    const classList = received.classList;
    const pass = expectedClasses.every((cls: string) => classList.contains(cls));
    return {
      pass,
      message: () => 
        `expected element to ${pass ? 'not ' : ''}have class(es) "${expectedClasses.join(', ')}". Received classes: "${received.className}"`,
    };
  },
  
  toHaveAttribute(received, name, expectedValue) {
    if (!received || typeof received.getAttribute !== 'function') {
      return {
        pass: false,
        message: () => `expected received to be a DOM element with getAttribute`,
      };
    }
    const hasAttr = received.hasAttribute(name);
    const actualValue = received.getAttribute(name);
    const pass = expectedValue !== undefined ? hasAttr && actualValue === expectedValue : hasAttr;
    return {
      pass,
      message: () => 
        `expected element to ${pass ? 'not ' : ''}have attribute "${name}"${expectedValue !== undefined ? ` with value "${expectedValue}"` : ''}. Received: "${actualValue}"`,
    };
  }
});
