// ============================================================
// EXAMPLE UI KIT SCHEMA
// ============================================================
// This is an example schema showing how to define your UI kit
// for the prompt engine to understand.

import { UIKitSchema } from '../src/types';

const exampleSchema: UIKitSchema = {
  name: 'MyUIKit',
  version: '1.0.0',

  components: {
    // ========================================
    // BUTTONS
    // ========================================
    button: {
      displayName: 'Button',
      category: 'input',
      aliases: ['btn', 'cta', 'action', 'submit'],
      variants: ['primary', 'secondary', 'ghost', 'danger', 'success', 'outline', 'link'],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      isContainer: false,
      props: {
        variant: {
          type: 'enum',
          options: ['primary', 'secondary', 'ghost', 'danger', 'success', 'outline', 'link'],
          default: 'primary'
        },
        size: {
          type: 'enum',
          options: ['xs', 'sm', 'md', 'lg', 'xl'],
          default: 'md'
        },
        disabled: {
          type: 'boolean',
          default: false
        },
        loading: {
          type: 'boolean',
          default: false
        },
        icon: {
          type: 'node',
          description: 'Icon to display'
        },
        iconPosition: {
          type: 'enum',
          options: ['left', 'right'],
          default: 'left'
        },
        fullWidth: {
          type: 'boolean',
          default: false
        },
        onClick: {
          type: 'function'
        }
      },
      defaultProps: {
        variant: 'primary',
        size: 'md'
      },
      examples: [
        { prompt: 'primary button', output: '<Button variant="primary">Click me</Button>' },
        { prompt: 'large danger button', output: '<Button variant="danger" size="lg">Delete</Button>' },
        { prompt: 'loading button', output: '<Button loading>Please wait...</Button>' },
        { prompt: 'button with icon', output: '<Button icon={<IconPlus />}>Add Item</Button>' }
      ],
      relatedTo: ['iconButton', 'buttonGroup']
    },

    // ========================================
    // INPUTS
    // ========================================
    input: {
      displayName: 'Input',
      category: 'input',
      aliases: ['textfield', 'text input', 'textbox', 'field'],
      variants: ['default', 'filled', 'outlined'],
      sizes: ['sm', 'md', 'lg'],
      isContainer: false,
      props: {
        type: {
          type: 'enum',
          options: ['text', 'email', 'password', 'number', 'tel', 'url'],
          default: 'text'
        },
        placeholder: {
          type: 'string'
        },
        label: {
          type: 'string'
        },
        error: {
          type: 'string'
        },
        disabled: {
          type: 'boolean',
          default: false
        },
        required: {
          type: 'boolean',
          default: false
        }
      },
      examples: [
        { prompt: 'email input', output: '<Input type="email" placeholder="Enter email" />' },
        { prompt: 'password field', output: '<Input type="password" placeholder="Password" />' }
      ]
    },

    textarea: {
      displayName: 'Textarea',
      category: 'input',
      aliases: ['text area', 'multiline', 'textbox'],
      sizes: ['sm', 'md', 'lg'],
      isContainer: false,
      props: {
        rows: {
          type: 'number',
          default: 4
        },
        placeholder: {
          type: 'string'
        },
        resize: {
          type: 'enum',
          options: ['none', 'vertical', 'horizontal', 'both'],
          default: 'vertical'
        }
      }
    },

    select: {
      displayName: 'Select',
      category: 'input',
      aliases: ['dropdown', 'picker', 'combobox'],
      sizes: ['sm', 'md', 'lg'],
      isContainer: false,
      props: {
        options: {
          type: 'array',
          required: true
        },
        placeholder: {
          type: 'string'
        },
        multiple: {
          type: 'boolean',
          default: false
        }
      }
    },

    checkbox: {
      displayName: 'Checkbox',
      category: 'input',
      aliases: ['check', 'tick'],
      isContainer: false,
      props: {
        checked: {
          type: 'boolean'
        },
        label: {
          type: 'string'
        },
        disabled: {
          type: 'boolean'
        }
      }
    },

    // ========================================
    // CONTAINERS
    // ========================================
    card: {
      displayName: 'Card',
      category: 'container',
      aliases: ['panel', 'box', 'container'],
      variants: ['default', 'bordered', 'elevated', 'flat'],
      isContainer: true,
      accepts: ['*'],
      props: {
        variant: {
          type: 'enum',
          options: ['default', 'bordered', 'elevated', 'flat'],
          default: 'default'
        },
        padding: {
          type: 'enum',
          options: ['none', 'sm', 'md', 'lg'],
          default: 'md'
        },
        rounded: {
          type: 'boolean',
          default: true
        }
      },
      examples: [
        { prompt: 'card with shadow', output: '<Card variant="elevated">Content</Card>' },
        { prompt: 'bordered card', output: '<Card variant="bordered">Content</Card>' }
      ]
    },

    modal: {
      displayName: 'Modal',
      category: 'container',
      aliases: ['dialog', 'popup', 'overlay'],
      isContainer: true,
      accepts: ['*'],
      props: {
        open: {
          type: 'boolean',
          required: true
        },
        onClose: {
          type: 'function'
        },
        title: {
          type: 'string'
        },
        size: {
          type: 'enum',
          options: ['sm', 'md', 'lg', 'xl', 'full'],
          default: 'md'
        }
      }
    },

    // ========================================
    // LAYOUT
    // ========================================
    grid: {
      displayName: 'Grid',
      category: 'layout',
      aliases: ['columns', 'layout'],
      isContainer: true,
      accepts: ['*'],
      props: {
        cols: {
          type: 'number',
          default: 12
        },
        gap: {
          type: 'enum',
          options: ['none', 'sm', 'md', 'lg'],
          default: 'md'
        },
        responsive: {
          type: 'object'
        }
      }
    },

    flex: {
      displayName: 'Flex',
      category: 'layout',
      aliases: ['flexbox', 'row', 'column', 'stack'],
      isContainer: true,
      accepts: ['*'],
      props: {
        direction: {
          type: 'enum',
          options: ['row', 'column', 'row-reverse', 'column-reverse'],
          default: 'row'
        },
        align: {
          type: 'enum',
          options: ['start', 'center', 'end', 'stretch', 'baseline'],
          default: 'stretch'
        },
        justify: {
          type: 'enum',
          options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
          default: 'start'
        },
        gap: {
          type: 'enum',
          options: ['none', 'sm', 'md', 'lg'],
          default: 'md'
        },
        wrap: {
          type: 'boolean',
          default: false
        }
      }
    },

    // ========================================
    // NAVIGATION
    // ========================================
    navbar: {
      displayName: 'Navbar',
      category: 'navigation',
      aliases: ['navigation', 'nav', 'header', 'topbar'],
      isContainer: true,
      accepts: ['button', 'link', 'logo', 'navItem'],
      props: {
        sticky: {
          type: 'boolean',
          default: false
        },
        transparent: {
          type: 'boolean',
          default: false
        }
      }
    },

    sidebar: {
      displayName: 'Sidebar',
      category: 'navigation',
      aliases: ['sidenav', 'drawer', 'menu'],
      isContainer: true,
      accepts: ['navItem', 'link', 'divider'],
      props: {
        position: {
          type: 'enum',
          options: ['left', 'right'],
          default: 'left'
        },
        collapsed: {
          type: 'boolean',
          default: false
        },
        width: {
          type: 'string',
          default: '250px'
        }
      }
    },

    tabs: {
      displayName: 'Tabs',
      category: 'navigation',
      aliases: ['tab', 'tablist'],
      isContainer: true,
      accepts: ['tabItem'],
      props: {
        defaultValue: {
          type: 'string'
        },
        variant: {
          type: 'enum',
          options: ['default', 'pills', 'underline'],
          default: 'default'
        }
      }
    },

    // ========================================
    // FEEDBACK
    // ========================================
    alert: {
      displayName: 'Alert',
      category: 'feedback',
      aliases: ['notification', 'message', 'banner'],
      variants: ['info', 'success', 'warning', 'error'],
      isContainer: false,
      props: {
        variant: {
          type: 'enum',
          options: ['info', 'success', 'warning', 'error'],
          default: 'info'
        },
        title: {
          type: 'string'
        },
        dismissible: {
          type: 'boolean',
          default: false
        }
      }
    },

    tooltip: {
      displayName: 'Tooltip',
      category: 'feedback',
      aliases: ['hint', 'tip'],
      isContainer: true,
      accepts: ['*'],
      props: {
        content: {
          type: 'string',
          required: true
        },
        position: {
          type: 'enum',
          options: ['top', 'right', 'bottom', 'left'],
          default: 'top'
        }
      }
    },

    spinner: {
      displayName: 'Spinner',
      category: 'feedback',
      aliases: ['loading', 'loader'],
      sizes: ['sm', 'md', 'lg'],
      isContainer: false,
      props: {
        size: {
          type: 'enum',
          options: ['sm', 'md', 'lg'],
          default: 'md'
        }
      }
    },

    // ========================================
    // DISPLAY
    // ========================================
    avatar: {
      displayName: 'Avatar',
      category: 'display',
      aliases: ['profile', 'user image'],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      isContainer: false,
      props: {
        src: {
          type: 'string'
        },
        alt: {
          type: 'string'
        },
        fallback: {
          type: 'string'
        },
        size: {
          type: 'enum',
          options: ['xs', 'sm', 'md', 'lg', 'xl'],
          default: 'md'
        }
      }
    },

    badge: {
      displayName: 'Badge',
      category: 'display',
      aliases: ['tag', 'chip', 'label'],
      variants: ['default', 'primary', 'secondary', 'success', 'warning', 'danger'],
      isContainer: false,
      props: {
        variant: {
          type: 'enum',
          options: ['default', 'primary', 'secondary', 'success', 'warning', 'danger'],
          default: 'default'
        }
      }
    },

    image: {
      displayName: 'Image',
      category: 'display',
      aliases: ['img', 'picture', 'photo'],
      isContainer: false,
      props: {
        src: {
          type: 'string',
          required: true
        },
        alt: {
          type: 'string',
          required: true
        },
        width: {
          type: 'number'
        },
        height: {
          type: 'number'
        },
        objectFit: {
          type: 'enum',
          options: ['cover', 'contain', 'fill', 'none'],
          default: 'cover'
        }
      }
    },

    table: {
      displayName: 'Table',
      category: 'display',
      aliases: ['data table', 'grid'],
      isContainer: true,
      accepts: ['tableRow', 'tableHead', 'tableBody'],
      props: {
        striped: {
          type: 'boolean',
          default: false
        },
        bordered: {
          type: 'boolean',
          default: false
        },
        hoverable: {
          type: 'boolean',
          default: true
        }
      }
    }
  },

  // ========================================
  // LAYOUT TEMPLATES
  // ========================================
  layouts: {
    'two-column': {
      component: 'Grid',
      props: { cols: 2, gap: 'md' }
    },
    'three-column': {
      component: 'Grid',
      props: { cols: 3, gap: 'md' }
    },
    'sidebar-layout': {
      component: 'Grid',
      props: { cols: '250px 1fr' }
    },
    'centered': {
      wrapper: true,
      style: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }
    },
    'stack': {
      component: 'Flex',
      props: { direction: 'column', gap: 'md' }
    }
  },

  // ========================================
  // PAGE TEMPLATES
  // ========================================
  pages: {
    landing: ['Navbar', 'Hero', 'Features', 'Testimonials', 'CTA', 'Footer'],
    dashboard: ['Sidebar', 'Header', 'StatsGrid', 'Charts', 'RecentActivity'],
    login: ['Card > [Logo, Form > [Input, Input, Button]]'],
    settings: ['Sidebar', 'SettingsForm', 'Button'],
    profile: ['Avatar', 'Card > [ProfileInfo, EditButton]']
  }
};

export default exampleSchema;
