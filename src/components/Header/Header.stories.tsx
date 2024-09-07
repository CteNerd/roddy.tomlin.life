import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import Header from './Header';

export default {
  title: 'Components/Header',
  component: Header,
} as Meta;

const Template: StoryFn = (args) => <Header menus={[]} {...args} />;

export const Default = Template.bind({});
Default.args = {
  menus: [
    { title: 'Option 1', items: ['Sub 1', 'Sub 2', 'Sub 3'] },
    { title: 'Option 2', items: ['Sub 1', 'Sub 2', 'Sub 3'] },
    { title: 'Option 3', items: ['Sub 1', 'Sub 2', 'Sub 3'] },
    { title: 'Option 4', items: ['Sub 1', 'Sub 2', 'Sub 3'] },
    { title: 'Option 5', items: ['Sub 1', 'Sub 2', 'Sub 3'] },
  ],
};