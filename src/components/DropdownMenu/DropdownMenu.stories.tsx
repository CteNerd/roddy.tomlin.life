import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import DropdownMenu from './DropdownMenu';

interface HeaderProps {
    menu: {
      title: string;
      items: string[];
    };
  }

  const headerProps: HeaderProps = {
      menu: {
        title: '',
        items: []
      }
  }

export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
} as Meta;

const Template: StoryFn<{ title: string; items: string[] }> = (args) => <DropdownMenu menu={headerProps.menu } {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Menu',
  items: ['Option 1', 'Option 2', 'Option 3'],
};

export const WithMoreItems = Template.bind({});
WithMoreItems.args = {
  title: 'More Options',
  items: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'],
};