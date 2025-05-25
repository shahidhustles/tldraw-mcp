# Tldraw Shape Types Guide

## Overview

Tldraw uses a specific shape type system that differs from our simple descriptive names. Understanding this system is crucial for proper integration.

## Basic Shape Type Mapping

The mapping is as follows:

- For basic shapes (rectangle, ellipse, triangle, diamond), tldraw uses a "geo" type with a "geo" property specifying the actual shape
- For text, tldraw uses a "text" type
- For arrows/connectors, tldraw uses an "arrow" type

## Creating Basic Shapes

When we specify a "rectangle" in our API, TldrawEditor.tsx maps this to:

```tsx
editor.createShape({
  type: "geo",
  props: {
    geo: "rectangle",
    w: width,
    h: height,
    // other properties
  },
});
```

## Text Handling

Text handling is important to note. When adding text to a shape, we need to set it as a separate property:

```tsx
// First create the shape
const id = editor.createShape({
  type: "geo",
  props: {
    geo: "rectangle",
    w: width,
    h: height,
  },
});

// Then update it with text if needed
editor.updateShape({
  id,
  type: "geo",
  props: {
    text: "My text content",
  },
});
```

## Common Issues

1. **"No shape util found for type"**: This error occurs when you try to create a shape with a type that tldraw doesn't recognize. Always use the proper mapping (e.g., "geo" type with appropriate "geo" property).

2. **"Unexpected property"**: This happens when properties are placed incorrectly. For example, text should be a property inside props, not directly on the shape.

3. **Missing shapes**: If shapes aren't appearing, check that all required properties are provided and in the correct format.

This mapping is handled automatically in the TldrawEditor component.
