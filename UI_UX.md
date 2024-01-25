# UI and UX concerns

## Material Design

Rather than re-inventing the wheel, web developers can save a lot of time by using pre-packaged UI toolkits. Many enterprises create their own. For this application, we used the current [Material Design](https://m3.material.io/) toolkit. In the current version of the Material Design for web, the components are provided as "native web components" through the [Lit framework](https://m3.material.io/). This led to a pleasant development experience using elements such as `<md-text-button>` just like you would `<div>` and `<span>`.

https://github.com/macacollins/book-it/assets/5402373/f61c2df4-6d6b-4ad6-839e-8b900b69bbca

## Responsive Design

Users use many different screen sizes, and web applications need to resize themselves to work appropriately on all sizes. While a 10 pixel wide view is not practical for many reasons, we should at least support common phone sizes as well as desktop view.

This application will resize its elements to remain usable at many different screen sizes.

https://github.com/macacollins/book-it/assets/5402373/377f0102-0c30-4657-bd1b-8a31b3f4a6f4

## Dark Mode

While dark mode is not appropriate for all users due to [some accessibility concerns](https://medium.com/code-enigma/why-dark-mode-isnt-as-accessible-as-you-might-think-641aa61fb0ef), it is good to support dark mode if the user asks for it.

This application reads the user's browser dark mode preference when supported and switches the display to dark mode.

https://github.com/macacollins/book-it/assets/5402373/2ca7c590-597a-4e0b-8d9b-04df2e13ea9a
