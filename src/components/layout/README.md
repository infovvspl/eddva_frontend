# Layout Component Library

This directory contains the standard responsive layout components for the Eddva School frontend codebase.

## Mobile-First Philosophy
We use Tailwind CSS's default breakpoint system (sm, md, lg, xl, 2xl). All styles apply to mobile by default. Use breakpoint prefixes to override styles for larger screens.

**Do NOT hardcode pixel widths (e.g., w-[850px]).** Use fluid classes (w-full max-w-[850px]) or relative percentages.

## Shared Components

### <PageWrapper>
The top-level container for a page. Ensures min-height is screen and sets a unified background.
`	sx
import { PageWrapper } from '@/components/layout/PageWrapper';
<PageWrapper>...</PageWrapper>
`

### <Section>
Semantic HTML <section> with standardized vertical spacing (sm, md, lg, none). Use this to separate distinct vertical chunks of a page.
`	sx
import { Section } from '@/components/layout/Section';
<Section spacing="md">...</Section>
`

### <Container>
Constrains max-width for content to max-w-screen-xl and centers it with responsive horizontal padding (px-4 sm:px-6 lg:px-8). Use this inside <Section>.
`	sx
import { Container } from '@/components/layout/Container';
<Container>...</Container>
`

### <Grid>
A responsive CSS Grid component that automatically stacks on mobile and expands to the requested number of columns on larger screens.
`	sx
import { Grid } from '@/components/layout/Grid';
<Grid cols={3} gap="md">...</Grid>
`

By using these wrappers, new pages will automatically inherit the correct responsiveness without manual breakpoint tuning.
