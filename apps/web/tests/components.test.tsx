import type { DestinationRow, PassportRow } from '@stamped/core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Board } from '@/components/Board';
import { Compare } from '@/components/Compare';
import { FlightSearch } from '@/components/FlightSearch';
import { Stamp } from '@/components/Stamp';
import { TripProvider } from '@/components/TripContext';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/vietnam',
  useSearchParams: () => new URLSearchParams(),
}));

const dest = (
  code: string,
  name: string,
  type: DestinationRow['type'],
  optionTypes: DestinationRow['optionTypes'] = [type],
): DestinationRow => ({
  code,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  region: 'Asia',
  type,
  days: type === 'visa' ? null : 30,
  fee: 'Free',
  optionTypes,
});

describe('<Board>', () => {
  const rows = [dest('VN', 'Vietnam', 'evisa', ['evisa', 'free']), dest('TH', 'Thailand', 'free'), dest('CN', 'China', 'visa')];

  it('links each row to the destination for the current passport', () => {
    render(<Board rows={rows} passport="GB" />);
    expect(screen.getByRole('link', { name: /Thailand/ })).toHaveAttribute('href', '/thailand?passport=GB');
  });

  it('filters by entry type chip and by search', () => {
    render(<Board rows={rows} passport="GB" />);
    fireEvent.click(screen.getByRole('button', { name: /^Visa-free/ }));
    expect(screen.getByRole('link', { name: /Thailand/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: /China/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^All/ }));
    fireEvent.change(screen.getByLabelText('Search destinations'), { target: { value: 'zzz' } });
    expect(screen.getByText('No destination matches that search.')).toBeVisible();
  });

  it('shows a "2+ options" chip when a destination offers several ways in', () => {
    render(<Board rows={rows} passport="GB" />);
    fireEvent.click(screen.getByRole('button', { name: /2\+ options/ }));
    expect(screen.getByRole('link', { name: /Vietnam/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: /Thailand/ })).toBeNull();
  });
});

describe('<Compare>', () => {
  const pp = (code: string, name: string, type: PassportRow['type']): PassportRow => ({
    code,
    name,
    cover: '#123',
    type,
    days: 45,
    fee: 'Free',
    optionTypes: [type],
  });

  it('switches the page to the chosen passport and remembers it', () => {
    push.mockClear();
    render(<Compare destinationName="Vietnam" rows={[pp('GB', 'United Kingdom', 'free'), pp('IN', 'India', 'evisa')]} passport="GB" />);
    const yours = screen.getByText('Your passport').parentElement!;
    expect(within(yours).getByRole('button', { pressed: true })).toHaveTextContent('United Kingdom');
    fireEvent.click(screen.getByRole('button', { name: /India/ }));
    expect(push).toHaveBeenCalledWith('/vietnam?passport=IN', { scroll: false });
    expect(document.cookie).toContain('stamped_pp=IN');
  });
});

describe('<FlightSearch>', () => {
  const renderSearch = () =>
    render(
      <TripProvider today="2026-10-29" defaultDepart="2026-12-12">
        <FlightSearch
          destination={{ code: 'VN', name: 'Vietnam', nearNote: null, seasonMonths: 'SGBBGSSSGBBB' }}
          fromHint="Delhi"
          toHint="Hanoi"
        />
      </TripProvider>,
    );

  it('asks for both cities first', () => {
    renderSearch();
    expect(screen.getByTestId('flight-results')).toHaveTextContent('Type the city you fly from and the city you fly to.');
  });

  it('builds four provider links from typed city names', () => {
    renderSearch();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Mumbai' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'hanoi' } });
    const links = within(screen.getByTestId('flight-results')).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      expect.stringContaining('Skyscanner'),
      expect.stringContaining('Google Flights'),
      expect.stringContaining('Kayak'),
      expect.stringContaining('Aviasales'),
    ]);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/flights/bom/han/261212/261226/'));
    expect(screen.getByTestId('flight-results')).toHaveTextContent('Dec is peak season there');
  });

  it('falls back to Google Flights for a city it does not know', () => {
    renderSearch();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Pokhara' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Hanoi' } });
    const links = within(screen.getByTestId('flight-results')).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(screen.getByTestId('flight-results')).toHaveTextContent('We don’t recognise “Pokhara”'.replace('’', "'"));
  });

  it('remembers the From city between visits', () => {
    const { unmount } = renderSearch();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Dubai' } });
    unmount();
    renderSearch();
    expect(screen.getByLabelText('From')).toHaveValue('Dubai');
  });
});

describe('<Stamp>', () => {
  it('draws the same stamp for the same country and entry type', () => {
    const a = render(<Stamp slot="s1" code="TH" name="Thailand" type="free" days={60} date="2026-12-12" />);
    const shape = a.container.querySelector('.stampg')?.getAttribute('data-shape');
    expect(screen.getByRole('img', { name: 'Thailand entry stamp: admitted' })).toBeInTheDocument();
    expect(a.container).toHaveTextContent('60D');
    expect(a.container).toHaveTextContent('12 DEC 2026');
    a.unmount();
    const b = render(<Stamp slot="s1" code="TH" name="Thailand" type="free" days={60} date="2026-12-12" />);
    expect(b.container.querySelector('.stampg')?.getAttribute('data-shape')).toBe(shape);
  });
});
