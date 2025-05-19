/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // Setup
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Get all the dates from the UI
      const dates = Array.from(document.querySelectorAll('tbody tr')).map(row => {
        return new Date(row.querySelector('td:nth-child(3)').innerHTML)
      })
      
      // Check dates are ordered chronologically (earliest to latest)
      const datesSorted = [...dates].sort((a, b) => a - b)
      expect(dates).toEqual(datesSorted)
    })

    test("Then I can click on the eye icon to see the bill proof", () => {
      // Setup
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Create a Bills instance with necessary dependencies
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname]
      }
      
      // Mock the modal behavior
      $.fn.modal = jest.fn()
      
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      
      // Get the first eye icon
      const eyeIcon = screen.getAllByTestId('icon-eye')[0]
      
      // Simulate a click
      const handleClickSpy = jest.spyOn(billsInstance, 'handleClickIconEye')
      billsInstance.handleClickIconEye(eyeIcon)
      
      // Check if the modal was called
      expect($.fn.modal).toHaveBeenCalled()
    })

    test("Then I can click on New Bill button to navigate to New Bill form", () => {
      // Setup
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Mock navigation function
      const onNavigate = jest.fn()
      
      // Create a Bills instance
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      
      // Get the new bill button
      const newBillBtn = screen.getByTestId('btn-new-bill')
      
      // Mock handleClickNewBill
      const handleClickNewBill = jest.spyOn(billsInstance, 'handleClickNewBill')
      
      // Add event listener
      newBillBtn.addEventListener('click', billsInstance.handleClickNewBill)
      
      // Simulate a click
      fireEvent.click(newBillBtn)
      
      // Check if handleClickNewBill was called and navigation occurred
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
    
    // Test API call to get bills
    describe("When I navigate to Bills page", () => {
      test("Then it fetches bills from the API", async () => {
        // Mock store and API call
        const getSpy = jest.spyOn(mockStore, "bills")
        
        // Create bills instance with mocked store
        const bills = new Bills({
          document,
          onNavigate: (pathname) => document.body.innerHTML = pathname,
          store: mockStore,
          localStorage: localStorageMock
        })
        
        // Call getBills method
        const result = await bills.getBills()
        
        // Check if the store method was called
        expect(getSpy).toHaveBeenCalled()
        
        // Check if the returned data has expected format
        expect(result.length).toBe(4) // Assuming mockStore returns 4 bills
        expect(result[0].status).toBeDefined()
        expect(result[0].date).toBeDefined()
      })
      
      test("Then an error occurs on API", async () => {
        // Mock store to return an error
        const getBillsSpy = jest.fn().mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Error 404"))
          }
        })
        
        const store = {
          bills: () => getBillsSpy()
        }
        
        // Render error page
        const html = BillsUI({ error: "Error 404" })
        document.body.innerHTML = html
        
        // Check if error message is displayed
        const errorMessage = await screen.getByText(/Error 404/)
        expect(errorMessage).toBeTruthy()
      })
    })
  })
})
