// constants
import {CategoriesList} from "constants";
// services
import {getData, constructData} from "services";
import changeQuries from "services/changeQuries"
// submodules
import BlockContent from "./BlockContent/BlockContent";
import Categories from "./Categories/Categories";
import SearchPanel from "./SearchPanel/SearchPanel";

/**
 *  Основной класс релизующий общую логику и управляющий  отдельными частями модуля
 */
class StructuredContent {
    constructor(contentConfig, selector) {
        this.contentConfig = contentConfig; // основная конфигурация
        this.contentState = {
            filters: {
                search: "",
                category: ""
            },
            data: []
        } // базовый стейт
        this.root = document.querySelector(selector); // root  компонент в который будет рендерится контент
    }

    /**
     * Метод установки фильтров и поиска
     * @param category - требуемая категория
     * @param search - строка с поиском
     */
    setFilters = (category = "", search = "") => {
        const {blockContentInstance} = this;
        // значение фильтров
        const categoryValue = category ? category : "";
        const searchValue = search ? search : "";

        const quires = [{name: "category", value: categoryValue}, {name: "search", value: searchValue},];

        this.contentState.filters = {search: searchValue, category: categoryValue};// устанавливаем фильтры
        changeQuries(quires); // сохранение фильтров в url и  localStorage

        if (blockContentInstance) blockContentInstance.reRenderBlocks(); // вызываем ререндер у блока с контентом)

    }

    /**
     * Запрос на получение данных
     * @returns {Promise<void>}
     */
    getIntitalData = async () => {
        const {url, scheme} = this.contentConfig;
        const {feed} = await getData(url); // запрашиваем данные
        this.contentState.data = constructData(feed.entry, scheme); // форматируем данные на основе схемы
        this.getQueryFilters(); //  получем фильтры
    }

    getQueryFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);

        // GET  парамеmы
        const queryCategory = urlParams.get("category");
        const querySearch = urlParams.get("search");

        if (queryCategory || querySearch) {
            this.setFilters(queryCategory, querySearch);
        } else {
            this.setFilters(localStorage["category"]);
        }
    }


    /**
     *  Метод рендеринга вызывает иницилизвцию вложенных инстансов
     */
    render = () => {
        const {categoriesInstance, blockContentInstance, contentConfig: {hasSearch}} = this;
        categoriesInstance.init();
        blockContentInstance.init();
        if (hasSearch) {
            this.searchPanel.init();
        }
    }

    /**
     *  Асинзронная иницилизация
     * @returns {Promise<void>}
     */
    init = async () => {
        await this.getIntitalData(); // установка исходных данных
        const {root, setFilters, contentConfig: {scheme, hasSearch}} = this;
        const contentFields = Object.keys(scheme); // наейминги для полей
        const parentParametrs = {
            methods: {setFilters},
            state: this.contentState,
            contentFields
        } // параметры родителя для проброса в дочерние инстансы

        // создание инстансов дочерних компонентов
        this.categoriesInstance = new Categories(CategoriesList, root, parentParametrs);
        this.blockContentInstance = new BlockContent(root, parentParametrs);

        if (hasSearch) {
            this.searchPanel = new SearchPanel(root, parentParametrs);
            console.log(1);
        }

        // непосредственный рендеринг
        this.render();
    }
}

export default StructuredContent;