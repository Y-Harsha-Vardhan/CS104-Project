#This is a python script that can automate the process of entering the data into the webpage
#It is based on selenium (I used this because, the webpage depends heavily on JS to dynamically add the input text boxes)
#This gives us more control to the webpage, can perform any key-press and data entry events
from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random
from selenium.common.exceptions import ElementNotInteractableException, NoAlertPresentException

#If you are testing this in a Windows PC, then this will work when you install the MS Edge Driver.
#I am using MS Edge for this, setting its driver path, which I installed.
edge_driver_path = "C:/Drivers/msedgedriver.exe"

#Specifying the path of the webpage in my Local PC
service = Service(executable_path=edge_driver_path)

driver = webdriver.Edge(service=service)

#Set the path of the file here
driver.get("file:///C:/Users/yhars/CODE/CS104-Project/setup.html")

time.sleep(2)

#Assigning objects to the text-boxes by accessing them with their IDs, to send input
team1_name = driver.find_element(By.ID, "team1")
team2_name = driver.find_element(By.ID, "team2")
toss_winner = Select(driver.find_element(By.ID, "toss-winner"))
toss_decision = Select(driver.find_element(By.ID, "toss-decision"))
numOvers = driver.find_element(By.ID, "overs-input")

#Having a database of names for the players
CSK_Team = ['Ruturaj', 'Jadeja', 'Rahul', 'Shivam', 'Ravindra', 'Ashwin', 'Rasheed', 'Aayush', 'Curran', 'Pathirana', 'Anshul']
CSK_Bowl = ['Jadeja', 'Pathirana', 'Ashwin', 'Shivam', 'Curran']
RCB_Team = ['Kohli', 'Patidar', 'Siraj', 'Bhuvneshwar', 'Krunal', 'Maxwell', 'David', 'Hazlewood', 'Salt', 'Suyash', 'Manoj']
RCB_Bowl = ['Siraj', 'Bhuvneshwar', 'Hazlewood', 'Krunal', 'Suyash']

#Sending input 
team1_name.send_keys("CSK")
team2_name.send_keys("RCB")
toss_winner.select_by_index(0)
toss_decision.select_by_index(0)
n = random.randint(1,20)
numOvers.send_keys(n)

#Clicking the button: 'Start Match', to go to the live page
driver.find_element(By.ID, "start-match").click()

#Waiting until the modal is loaded
wait = WebDriverWait(driver, 10)

wait.until(EC.visibility_of_element_located((By.ID, "name-prompt-modal")))
wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "#name-inputs input")))

#Assigning an object to the input fields which are dynamically added by JS
input_fields = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")

#Sending input for First Innings Starting Players
random.shuffle(CSK_Team)
random.shuffle(RCB_Bowl)
input_fields[0].send_keys(CSK_Team[0])
input_fields[1].send_keys(CSK_Team[1])
input_fields[2].send_keys(RCB_Bowl[0])

#Clicking the button: 'Submit Names', to start the Live Match
driver.find_element(By.ID, "submit-names").click()

#Writing a function which will click any random run buttonn and a function that handles a prompt
def clickRunBtns():
    for i in range(6):
        runBtns = driver.find_elements(By.CLASS_NAME, "run-btn")

        if runBtns:
            random_button = random.choice(runBtns)
            runs_value = random_button.get_attribute("data-runs")
            random_button.click()
            print(f"Clicked run btn: {runs_value}")
        else: 
            print("No run btns found")
            time.sleep(2)
        time.sleep(0.5)

def enterBowlerName():
    bowlerNames = ['Shami', 'Siraj', 'Bhuvneshwar', 'Arshdeep', 'Ashwin']
    input_fields = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")
    input_fields[0].send_keys(random.choice(bowlerNames))
    driver.find_element(By.ID, "submit-names").click()



#Calling the function: 
clickRunBtns()
enterBowlerName()
time.sleep(1)
clickRunBtns()
driver.find_element(By.ID, "continue").click()
time.sleep(1)

#Now started Second Innings:

#Assigning an object to the input fields which are dynamically added by JS
input_fields = driver.find_elements(By.CSS_SELECTOR, "#name-inputs input")

#Sending input
input_fields[0].send_keys("Kohli")
input_fields[1].send_keys("Rohit")
input_fields[2].send_keys("Mayank")

#Clicking the button: 'Submit Names', to start the Live Match
driver.find_element(By.ID, "submit-names").click()

#Calling the function:
clickRunBtns()
time.sleep(1)
enterBowlerName()
time.sleep(1)
#clickRunBtns()
# driver.find_element(By.ID, "continue").click()
# time.sleep(10)

#Waiting before closing the web-page
time.sleep(1000)


